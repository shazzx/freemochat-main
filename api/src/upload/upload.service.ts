import { Injectable, UnprocessableEntityException, UnsupportedMediaTypeException } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Media } from 'src/schema/media';
import { Model } from 'mongoose';
import { DetectModerationLabelsCommand, GetContentModerationCommand, RekognitionClient, StartContentModerationCommand } from '@aws-sdk/client-rekognition';
import { DetectDocumentTextCommand, TextractClient } from '@aws-sdk/client-textract';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import pdfParse from 'pdf-parse';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class UploadService {
    private rekognitionClient: RekognitionClient;
    private s3Client: S3Client;
    private textractClient: TextractClient;
    private bucketName: string;

    constructor(
        private readonly configService: ConfigService, private readonly userService: UserService,
        @InjectModel(Media.name) private mediaModel: Model<Media>) {
        this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
        const awsConfig = {
            region: process.env.AWS_S3_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                endpoint: process.env.AWS_BUCKET_ENDPOINT,
                region: process.env.AWS_S3_REGION,
                maxAttempts: 5,
                retryMode: 'adaptive',
            },
        };

        this.rekognitionClient = new RekognitionClient(awsConfig);
        this.s3Client = new S3Client(awsConfig);
        this.textractClient = new TextractClient(awsConfig);
    }

    async processAndUploadContent(
        file: Buffer,
        fileName: string,
        contentType: string,
        originalname?: string,
    ) {
        let processedContent: Buffer;
        let moderationResult: { isSafe: boolean; labels: string[] } | string;

        if (contentType == 'image') {
            // processedContent = await this.optimizeImage(file);
            // console.log(processedContent, "processedContent")
            moderationResult = await this.moderateImage(file);
            // const uploadResult = await this.uploadToS3(file, fileName, contentType);
            // return {url: uploadResult, fileName, fileType: contentType};
            // console.log(moderationResult, "moderationresults")
        } else if (contentType == 'video') {
            const inputInfo = await this.getVideoInfo(file);
            console.log(inputInfo)
            if (!inputInfo.format.includes('mp4') || !inputInfo.format.includes('mov')) {
                throw new UnprocessableEntityException()
            }
            // processedContent = await this.optimizeVideo(file, inputInfo);
            moderationResult = await this.moderateVideo(file, fileName);
            return { url: moderationResult, fileName, fileType: contentType, originalname };

        } else if (contentType == 'pdf') {
            processedContent = file; // No optimization for PDF
            moderationResult = await this.moderatePdf(file);
        } else if (contentType == 'audio') {
            const uploadResult = await this.uploadToS3(file, fileName, contentType);
            return { url: uploadResult, fileName, fileType: contentType };
        }


        else {
            console.log(contentType, 'contenttype')
            throw new Error('Unsupported file type');
        }
        console.log(moderationResult)

        if (moderationResult.isSafe) {
            const uploadResult = await this.uploadToS3(file, fileName, contentType);
            return { url: uploadResult, fileName, fileType: contentType, originalname };
        } else {
            throw new Error('Content violates moderation policies');
        }
    }

    private async optimizeImage(file: Buffer): Promise<Buffer> {
        return sharp(file)
            .webp({ quality: 80 })
            .toBuffer();
    }


    private getVideoInfo(inputBuffer: Buffer): Promise<{ format: string; codec: string }> {
        return new Promise((resolve, reject) => {
            const inputStream = new Readable();
            inputStream.push(inputBuffer);
            inputStream.push(null);

            ffmpeg(inputStream).ffprobe((err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                const videoStream = data.streams.find(stream => stream.codec_type === 'video');
                resolve({
                    format: data.format.format_name,
                    codec: videoStream ? videoStream.codec_name : 'unknown'
                });
            });
        });
    }

    private async optimizeVideo(file: Buffer, inputInfo: { format: string; codec: string }): Promise<Buffer> {
        console.log(file, 'video optimization')
        const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.${inputInfo.format.split(',')[0]}`);
        const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

        await fs.promises.writeFile(tempInputPath, file);

        return new Promise((resolve, reject) => {
            ffmpeg(tempInputPath)
                .output(tempOutputPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .videoBitrate('1000k')
                .audioBitrate('128k')
                .outputOptions([
                    '-preset medium',
                    '-crf 23',
                    '-movflags faststart',
                    '-pix_fmt yuv420p'
                ])
                .on('start', (commandLine) => {
                    console.log(`FFmpeg process started: ${commandLine}`);
                })
                .on('progress', (progress) => {
                    console.log(`Processing: ${progress.percent}% done`);
                })
                .on('end', async () => {
                    console.log('FFmpeg processing finished');
                    const outputBuffer = await fs.promises.readFile(tempOutputPath);
                    await fs.promises.unlink(tempInputPath);
                    await fs.promises.unlink(tempOutputPath);
                    resolve(outputBuffer);
                })
                .on('error', async (err) => {
                    console.error(`FFmpeg error: ${err.message}`);
                    await fs.promises.unlink(tempInputPath).catch(() => { });
                    await fs.promises.unlink(tempOutputPath).catch(() => { });
                    reject(err);
                })
                .run();
        });
    }

    private async moderateImage(file: Buffer): Promise<{ isSafe: boolean; labels: string[] }> {
        const command = new DetectModerationLabelsCommand({
            Image: { Bytes: file },
            MinConfidence: 70,
        });

        try {
            const response = await this.rekognitionClient.send(command);
            const labels = response.ModerationLabels?.map(label => label.Name) || [];
            return { isSafe: labels.length === 0, labels };
        } catch (error) {
            console.error('Error in image moderation:', error);
            throw error;
        }
    }

    private async moderatePdf(file: Buffer): Promise<{ isSafe: boolean; labels: string[] }> {
        try {
            const pdfData = await pdfParse(file);
            const command = new DetectDocumentTextCommand({
                Document: { Bytes: Buffer.from(pdfData.text) },
            });

            const response = await this.textractClient.send(command);
            // Implement your own logic to check for inappropriate content in the text
            const isSafe = !response.Blocks?.some(block =>
                block.BlockType === 'LINE' &&
                /inappropriate|offensive/i.test(block.Text || '')
            );

            return { isSafe, labels: isSafe ? [] : ['Inappropriate content detected'] };
        } catch (error) {
            console.error('Error in PDF moderation:', error);
            throw error;
        }
    }


    private async moderateVideo(file: Buffer, fileName: string): Promise<string> {
        const s3Key = `${fileName}`;

        // Upload video to S3
        let url = await this.uploadToS3(file, s3Key, 'video/mp4');
        return url

        const startCommand = new StartContentModerationCommand({
            Video: {
                S3Object: {
                    Bucket: this.bucketName,
                    Name: s3Key,
                },
            },
            MinConfidence: 70,
        });

        try {
            const startResponse = await this.rekognitionClient.send(startCommand);
            const jobId = startResponse.JobId;

            let jobComplete = false;
            let moderationResult;
            while (!jobComplete) {
                const getCommand = new GetContentModerationCommand({ JobId: jobId });
                moderationResult = await this.rekognitionClient.send(getCommand);
                jobComplete = moderationResult.JobStatus === 'SUCCEEDED';
                console.log(moderationResult)
                if (moderationResult.JobStatus === "FAILED" && moderationResult.StatusMessage) {
                    throw new UnsupportedMediaTypeException("Unsupported Format")
                }
                if (!jobComplete) await new Promise(resolve => setTimeout(resolve, 3000));
            }

            const labels = moderationResult.ModerationLabels?.map(label => label.ModerationLabel.Name) || [];

            if (labels.length === 0) {
                return url
            } else {
                throw new Error('Content violates moderation policies');
            }

        } catch (error) {
            console.error('Error in video moderation:', error);
            // Ensure we delete the temporary file even if there's an error
            await this.deleteFromS3(s3Key);
            throw error;
        }
    }

    async uploadToS3(file: Buffer, key: string, contentType: string) {
        // const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
        let fileName = encodeURIComponent(key)
        console.log(file)
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: file,
            // ContentType: contentType,
        });

        try {
            await this.s3Client.send(command);
            return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw error;
        }
    }

    async deleteFromS3(key: string) {
        const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        try {
            return await this.s3Client.send(command);
        } catch (error) {
            console.error('Error deleting from S3:', error);
            // We're not throwing here to avoid breaking the main flow if deletion fails
        }
    }

    async uploadFile(filename: string, file: Buffer) {
        let fileName = encodeURIComponent(filename)
        let uploadedFile = await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: file,
        }))

        return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`
    }
}