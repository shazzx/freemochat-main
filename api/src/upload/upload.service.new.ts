import { Injectable, UnprocessableEntityException, UnsupportedMediaTypeException } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
    MediaConvertClient,
    CreateJobCommand,
    GetJobCommand,
    DescribeEndpointsCommand
} from '@aws-sdk/client-mediaconvert';
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
import { v4 as uuidv4 } from 'uuid';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class UploadService {
    private rekognitionClient: RekognitionClient;
    private s3Client: S3Client;
    private textractClient: TextractClient;
    private mediaConvertClient: MediaConvertClient;
    private mediaConvertEndpoint: string;
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

        // Initialize MediaConvert client
        this.mediaConvertClient = new MediaConvertClient({
            ...awsConfig,
            // MediaConvert needs a specific endpoint that we'll fetch on service initialization
        });

        // Initialize MediaConvert endpoint
        this.initializeMediaConvert();
    }

    private async initializeMediaConvert() {
        try {
            const { Endpoints } = await this.mediaConvertClient.send(new DescribeEndpointsCommand({}));
            if (Endpoints && Endpoints.length > 0) {
                this.mediaConvertEndpoint = Endpoints[0].Url;
                // Update the client with the correct endpoint
                this.mediaConvertClient = new MediaConvertClient({
                    region: process.env.AWS_S3_REGION,
                    credentials: {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    },
                    endpoint: this.mediaConvertEndpoint
                });
                console.log(`MediaConvert endpoint initialized: ${this.mediaConvertEndpoint}`);
            } else {
                throw new Error('Failed to retrieve MediaConvert endpoints');
            }
        } catch (error) {
            console.error('Error initializing MediaConvert:', error);
            throw error;
        }
    }

    async processAndUploadContent(
        file: Buffer,
        fileName: string,
        contentType: string,
        originalname?: string,
        isReel: boolean = false,
    ) {
        let processedContent: Buffer;
        let moderationResult: { isSafe: boolean; labels: string[] } | string;

        if (contentType == 'image') {
            const resizedImageForRekognition = await this.resizeImageForRekognition(file);
            moderationResult = await this.moderateImage(resizedImageForRekognition);
        } else if (contentType == 'video') {
            const inputInfo = await this.getVideoInfo(file);
            console.log(inputInfo);

            if (!inputInfo.format.includes('mp4') && !inputInfo.format.includes('mov')) {
                throw new UnprocessableEntityException('Unsupported video format. Only MP4 and MOV are supported.');
            }

            // If it's a reel, use MediaConvert for optimal social media formatting
            if (isReel) {
                return await this.processReelVideo(file, fileName, originalname);
            } else {
                moderationResult = await this.moderateVideo(file, fileName);
                return { url: moderationResult, fileName, fileType: contentType, originalname };
            }
        } else if (contentType == 'pdf') {
            processedContent = file; // No optimization for PDF
            moderationResult = await this.moderatePdf(file);
        } else if (contentType == 'audio') {
            const uploadResult = await this.uploadToS3(file, fileName, contentType);
            return { url: uploadResult, fileName, fileType: contentType };
        } else {
            console.log(contentType, 'contenttype');
            throw new Error('Unsupported file type');
        }

        console.log(moderationResult);

        if (moderationResult.isSafe) {
            const uploadResult = await this.uploadToS3(file, fileName, contentType);
            return { url: uploadResult, fileName, fileType: contentType, originalname };
        } else {
            throw new Error('Content violates moderation policies');
        }
    }

    async processReelVideo(file: Buffer, fileName: string, originalname?: string) {
        try {
            // 1. Upload the original file to S3 first
            const inputKey = `temp/input/${fileName}`;
            await this.uploadToS3(file, inputKey, 'video/mp4');
            const inputPath = `s3://${this.bucketName}/${inputKey}`;

            // 2. Set up output path with unique identifier
            const uniqueId = uuidv4();
            const outputKey = `processed/reels/${fileName.split('.')[0]}-${uniqueId}.mp4`;
            const outputPath = `s3://${this.bucketName}/${outputKey}`;

            // 3. Create the MediaConvert job for reel optimization
            const jobId = await this.createMediaConvertJob(inputPath, outputPath);

            // 4. Wait for the job to complete (with timeout)
            await this.waitForMediaConvertJob(jobId);

            // 5. Clean up temp input file
            await this.deleteFromS3(inputKey);

            // 6. Return the optimized video URL
            const outputUrl = `https://${this.bucketName}.s3.amazonaws.com/${outputKey}`;

            return {
                url: outputUrl,
                fileName: outputKey,
                fileType: 'video',
                originalname,
                isOptimized: true
            };
        } catch (error) {
            console.error('Error processing reel video:', error);
            throw new Error(`Failed to process reel video: ${error.message}`);
        }
    }

    private async createMediaConvertJob(inputPath: string, outputPath: string): Promise<string> {
        try {
            console.log(`Creating MediaConvert job: ${inputPath} → ${outputPath}`);

            // Create basic job parameters structure
            const jobParams: any = {
                Role: process.env.AWS_MEDIACONVERT_ROLE,
                Settings: {
                    Inputs: [
                        {
                            FileInput: inputPath,
                            AudioSelectors: {
                                'Audio Selector 1': {
                                    DefaultSelection: 'DEFAULT'
                                }
                            },
                            VideoSelector: {},
                            TimecodeSource: 'ZEROBASED'
                        }
                    ],
                    OutputGroups: [
                        {
                            Name: 'Social Media Optimized',
                            OutputGroupSettings: {
                                Type: 'FILE_GROUP_SETTINGS',
                                FileGroupSettings: {
                                    Destination: outputPath
                                }
                            },
                            Outputs: [
                                {
                                    // Video configuration optimized for social media
                                    VideoDescription: {
                                        ScalingBehavior: 'DEFAULT',
                                        Width: 1080,
                                        Height: 1920,
                                        CodecSettings: {
                                            Codec: 'H_264',
                                            H264Settings: {
                                                MaxBitrate: 6000000,
                                                RateControlMode: 'QVBR',
                                                QvbrSettings: {
                                                    QvbrQualityLevel: 8
                                                },
                                                FramerateControl: 'INITIALIZE_FROM_SOURCE',
                                                ProfileLevel: 'HIGH',
                                                GopSize: 2, // Short GOP for better scrubbing
                                                GopClosedCadence: 1,
                                                GopBReference: 'ENABLED',
                                                AdaptiveQuantization: 'non-Auto',
                                                SpatialAdaptiveQuantization: 'ENABLED',
                                                TemporalAdaptiveQuantization: 'ENABLED',
                                                FlickerAdaptiveQuantization: 'ENABLED',
                                                EntropyEncoding: 'CABAC',
                                                Slices: 1
                                            }
                                        },
                                        AfdSignaling: 'NONE',
                                        DropFrameTimecode: 'ENABLED',
                                        RespondToAfd: 'NONE'
                                    },
                                    // Audio configuration
                                    AudioDescriptions: [
                                        {
                                            AudioTypeControl: 'FOLLOW_INPUT',
                                            CodecSettings: {
                                                Codec: 'AAC',
                                                AacSettings: {
                                                    Bitrate: 320000,
                                                    CodingMode: 'CODING_MODE_2_0',
                                                    SampleRate: 48000
                                                }
                                            },
                                            LanguageCodeControl: 'FOLLOW_INPUT',
                                            AudioSourceName: 'Audio Selector 1'
                                        }
                                    ],
                                    ContainerSettings: {
                                        Container: 'MP4',
                                        Mp4Settings: {
                                            CslgAtom: 'INCLUDE',
                                            FreeSpaceBox: 'EXCLUDE',
                                            MoovPlacement: 'PROGRESSIVE_DOWNLOAD',
                                            MpegtsScte35Esam: 'NONE'
                                        }
                                    },
                                    Extension: 'mp4',
                                    NameModifier: '-social'
                                }
                            ]
                        }
                    ],
                    TimecodeConfig: {
                        Source: 'ZEROBASED'
                    }
                },
                StatusUpdateInterval: 'SECONDS_60',
                Priority: 0
            };

            // Create the MediaConvert job
            const command = new CreateJobCommand(jobParams);
            const response = await this.mediaConvertClient.send(command);

            if (!response.Job || !response.Job.Id) {
                throw new Error('Failed to create MediaConvert job: no job ID returned');
            }

            console.log(`MediaConvert job created successfully. Job ID: ${response.Job.Id}`);
            return response.Job.Id;
        } catch (error) {
            console.error('Error creating MediaConvert job:', error);
            throw new Error(`Failed to create MediaConvert job: ${error.message}`);
        }
    }

    private async waitForMediaConvertJob(jobId: string, maxAttempts = 60) {
        console.log(`Waiting for MediaConvert job ${jobId} to complete...`);
        let attempts = 0;
        let jobStatus;

        while (attempts < maxAttempts) {
            try {
                const command = new GetJobCommand({ Id: jobId });
                const response = await this.mediaConvertClient.send(command);
                jobStatus = response.Job.Status;

                console.log(`Job status: ${jobStatus} (attempt ${attempts + 1}/${maxAttempts})`);

                if (jobStatus === 'COMPLETE') {
                    console.log(`MediaConvert job ${jobId} completed successfully`);
                    return response.Job;
                } else if (jobStatus === 'ERROR') {
                    throw new Error(`MediaConvert job failed: ${response.Job.ErrorMessage}`);
                } else if (jobStatus === 'CANCELED') {
                    throw new Error('MediaConvert job was canceled');
                }

                // Wait before checking again (5 seconds)
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;
            } catch (error) {
                console.error(`Error checking MediaConvert job status: ${error}`);
                throw error;
            }
        }

        throw new Error(`MediaConvert job ${jobId} did not complete within the expected time`);
    }

    async resizeImageForRekognition(imageBuffer: Buffer): Promise<Buffer> {
        const sharp = require('sharp');

        try {
            // Get image metadata first to make informed decisions
            const metadata = await sharp(imageBuffer).metadata();
            console.log(`Original image: ${metadata.width}x${metadata.height}, ${imageBuffer.length / (1024 * 1024)} MB`);

            // Start with aggressive downsizing for very large images
            const maxDimension = Math.max(metadata.width || 0, metadata.height || 0);
            let targetWidth, targetHeight, quality;

            if (maxDimension > 4000) {
                // Very large image
                targetWidth = 600;
                quality = 30;
            } else if (maxDimension > 2000) {
                // Large image
                targetWidth = 800;
                quality = 40;
            } else {
                // Moderate sized image
                targetWidth = 1000;
                quality = 50;
            }

            // Process in a memory-efficient way
            let resizedBuffer = await sharp(imageBuffer, { limitInputPixels: 100000000 })
                .resize({ width: targetWidth, withoutEnlargement: true })
                .jpeg({ quality: quality })
                .toBuffer();

            console.log(`Resized to: ${resizedBuffer.length / (1024 * 1024)} MB`);

            // If still too big, try more extreme measures
            if (resizedBuffer.length > 4.5 * 1024 * 1024) {
                resizedBuffer = await sharp(resizedBuffer)
                    .resize({ width: 500 })
                    .jpeg({ quality: 20 })
                    .toBuffer();
                console.log(`Further resized to: ${resizedBuffer.length / (1024 * 1024)} MB`);
            }

            return resizedBuffer;

        } catch (error) {
            console.error('Error during image resizing:', error);
            throw new Error(`Failed to resize image: ${error.message}`);
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
            ContentType: contentType,
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