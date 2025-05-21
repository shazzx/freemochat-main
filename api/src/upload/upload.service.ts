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
import { PostsService } from 'src/posts/posts.service';

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

    // async watermarkVideoFromSignedUrl(
    //     signedUrl: string,
    //     options: {
    //         watermarkImagePath?: string;
    //         position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
    //         opacity?: number;
    //         scale?: number;
    //         text?: string;
    //         fontColor?: string;
    //         fontSize?: number;
    //     } = {}
    // ): Promise<string> {
    //     // Use node-fetch to download from URL
    //     const fetch = require('node-fetch');

    //     try {
    //         // Set defaults for options
    //         const watermarkImagePath = options.watermarkImagePath || 'api/assets/freedombook-logo.png'
    //         const position = options.position || 'bottomRight';
    //         const opacity = options.opacity || 0.8;
    //         const scale = options.scale || 0.15; // Scale factor for the watermark image
    //         const useImageWatermark = !options.text; // If text is provided, use text watermark instead

    //         // Position mapping for overlay filter (image watermark)
    //         const positionMap = {
    //             topLeft: '10:10',
    //             topRight: 'main_w-overlay_w-10:10',
    //             bottomLeft: '10:main_h-overlay_h-10',
    //             bottomRight: 'main_w-overlay_w-10:main_h-overlay_h-10',
    //             center: '(main_w-overlay_w)/2:(main_h-overlay_h)/2'
    //         };

    //         console.log(`Starting watermark process for video: ${signedUrl}`);

    //         // 1. Download the video from the signed URL
    //         console.log(`Downloading video from signed URL...`);
    //         const response = await fetch(signedUrl);
    //         if (!response.ok) {
    //             throw new Error(`Failed to download video: ${response.statusText}`);
    //         }
    //         const videoBuffer = Buffer.from(await response.arrayBuffer());
    //         console.log(`Video downloaded, size: ${videoBuffer.length / (1024 * 1024)} MB`);

    //         // 2. Create temporary files for processing
    //         const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.mp4`);
    //         const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

    //         // 3. Write the downloaded buffer to a temporary file
    //         await fs.promises.writeFile(tempInputPath, videoBuffer);
    //         console.log(`Video saved to temporary file: ${tempInputPath}`);

    //         // 4. Check if watermark image exists
    //         if (useImageWatermark && !fs.existsSync(watermarkImagePath)) {
    //             console.warn(`Watermark image not found at ${watermarkImagePath}, falling back to text watermark`);
    //             options.text = 'FreedomBook'; // Fallback text
    //             options.fontColor = 'white';
    //             options.fontSize = 24;
    //         }

    //         // 5. Apply watermark
    //         console.log(useImageWatermark)
    //         console.log(`Applying ${useImageWatermark ? 'image' : 'text'} watermark...`);
    //         await new Promise<void>((resolve, reject) => {
    //             let ffmpegCommand = ffmpeg(tempInputPath);

    //             if (useImageWatermark && fs.existsSync(watermarkImagePath)) {
    //                 // Apply image watermark
    //                 ffmpegCommand = ffmpegCommand
    //                     .input(watermarkImagePath)
    //                     .complexFilter([
    //                         // Scale the watermark image
    //                         `[1:v]scale=iw*${scale}:-1[watermark]`,
    //                         // Set opacity and position for the watermark
    //                         `[watermark]format=rgba,colorchannelmixer=a=${opacity}[watermark1]`,
    //                         // Overlay the watermark on the video
    //                         `[0:v][watermark1]overlay=${positionMap[position]}[outv]`
    //                     ], 'outv');
    //             } else {
    //                 // Fallback to text watermark if image is not provided
    //                 ffmpegCommand = ffmpegCommand.videoFilters({
    //                     filter: 'drawtext',
    //                     options: {
    //                         text: options.text || 'FreedomBook',
    //                         fontsize: options.fontSize || 24,
    //                         fontcolor: options.fontColor || 'white',
    //                         x: 'main_w-tw-10',
    //                         y: 'main_h-th-10',
    //                         shadowcolor: 'black',
    //                         shadowx: 2,
    //                         shadowy: 2,
    //                         alpha: opacity.toString()
    //                     }
    //                 });
    //             }

    //             ffmpegCommand
    //                 .output(tempOutputPath)
    //                 .outputOptions([
    //                     '-codec:a copy',  // Copy audio codec
    //                     '-q:v 1'          // High quality
    //                 ])
    //                 .on('start', (commandLine) => {
    //                     console.log(`FFmpeg watermarking started: ${commandLine}`);
    //                 })
    //                 .on('progress', (progress) => {
    //                     console.log(`Watermarking progress: ${progress.percent}% done`);
    //                 })
    //                 .on('end', () => {
    //                     console.log('Watermarking completed');
    //                     resolve();
    //                 })
    //                 .on('error', (err) => {
    //                     console.error('Error during watermarking:', err);
    //                     reject(err);
    //                 })
    //                 .run();
    //         });

    //         // 6. Read the processed file
    //         console.log(`Reading watermarked video...`);
    //         const processedBuffer = await fs.promises.readFile(tempOutputPath);

    //         // 7. Generate a unique filename for the watermarked video
    //         const originalFilename = decodeURIComponent(new URL(signedUrl).pathname.split('/').pop() || 'video');
    //         const fileNameWithoutExt = originalFilename.split('.')[0];
    //         const watermarkedFileName = `${fileNameWithoutExt}-watermarked-${Date.now()}.mp4`;

    //         // 8. Upload to S3
    //         console.log(`Uploading watermarked video to S3...`);
    //         const uploadResult = await this.uploadToS3(processedBuffer, watermarkedFileName, 'video/mp4');
    //         console.log(`Watermarked video uploaded to: ${uploadResult}`);

    //         // 9. Clean up temporary files
    //         console.log(`Cleaning up temporary files...`);
    //         await fs.promises.unlink(tempInputPath).catch(() => { });
    //         await fs.promises.unlink(tempOutputPath).catch(() => { });

    //         console.log(`Watermark process completed successfully`);
    //         return uploadResult;
    //     } catch (error) {
    //         console.error('Error watermarking video:', error);
    //         throw error;
    //     }
    // }
    async watermarkVideoFromSignedUrl(
        signedUrl: string,
        options: {
            watermarkImagePath?: string;
            position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
            opacity?: number;
            scale?: number;
            text?: string;
            fontColor?: string;
            fontSize?: number;
        } = {},
        shouldUpdatePost?: boolean,
        postService?: PostsService,
        postDetails?: { postId: string, media: { type: string, url: string, thumbnail: string }[], isUploaded: null }
    ): Promise<string> {
        // Use node-fetch to download from URL
        const fetch = require('node-fetch');

        try {
            // Default path is in assets directory relative to this file
            const defaultImagePath = path.join(__dirname, '..', '..', 'assets', 'freedombook-logo.png');
            const watermarkImagePath = options.watermarkImagePath || defaultImagePath;

            const position = options.position || 'bottomRight';
            const opacity = options.opacity || 0.8;
            const scale = options.scale || 0.45;

            // Check if watermark image exists
            const imageExists = fs.existsSync(watermarkImagePath);

            if (!imageExists) {
                console.warn(`Watermark image not found at ${watermarkImagePath}`);
                console.log(`Full path attempted: ${path.resolve(watermarkImagePath)}`);

                if (!options.text) {
                    options.text = 'FreedomBook'; // Fallback text
                }
            } else {
                console.log(`Found watermark image at: ${watermarkImagePath}`);
            }

            console.log(`Starting watermark process for video: ${signedUrl}`);

            // 1. Download the video from the signed URL
            console.log(`Downloading video from signed URL...`);
            const response = await fetch(signedUrl);
            if (!response.ok) {
                throw new Error(`Failed to download video: ${response.statusText}`);
            }
            const videoBuffer = Buffer.from(await response.arrayBuffer());
            console.log(`Video downloaded, size: ${videoBuffer.length / (1024 * 1024)} MB`);

            // 2. Create temporary files for processing
            const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.mp4`);
            const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

            // 3. Write the downloaded buffer to a temporary file
            await fs.promises.writeFile(tempInputPath, videoBuffer);
            console.log(`Video saved to temporary file: ${tempInputPath}`);

            // 4. Apply watermark - text watermark is much more reliable, so we'll use that as a fallback
            console.log(`Using ${imageExists ? 'image' : 'text'} watermark...`);

            // First try with text watermark (works more consistently across FFmpeg versions)
            if (!imageExists || options.text) {
                await new Promise<void>((resolve, reject) => {
                    const text = options.text || 'FreedomBook';
                    const fontSize = options.fontSize || 24;
                    const fontColor = options.fontColor || 'white';

                    // Position mapping for text
                    let x, y;
                    switch (position) {
                        case 'topLeft':
                            x = '10';
                            y = '10';
                            break;
                        case 'topRight':
                            x = 'w-tw-10';
                            y = '10';
                            break;
                        case 'bottomLeft':
                            x = '10';
                            y = 'h-th-10';
                            break;
                        case 'bottomRight':
                            x = 'w-tw-10';
                            y = 'h-th-10';
                            break;
                        case 'center':
                            x = '(w-tw)/2';
                            y = '(h-th)/2';
                            break;
                    }

                    ffmpeg(tempInputPath)
                        .videoFilters({
                            filter: 'drawtext',
                            options: {
                                text: text,
                                fontsize: fontSize,
                                fontcolor: fontColor,
                                x: x,
                                y: y,
                                shadowcolor: 'black',
                                shadowx: 2,
                                shadowy: 2
                            }
                        })
                        .output(tempOutputPath)
                        .outputOptions([
                            '-codec:a copy',  // Copy audio codec
                            '-q:v 1'          // High quality
                        ])
                        .on('start', (commandLine) => {
                            console.log(`FFmpeg text watermarking started: ${commandLine}`);
                        })
                        .on('progress', (progress) => {
                            if (progress.percent) {
                                console.log(`Watermarking progress: ${Math.round(progress.percent)}% done`);
                            }
                        })
                        .on('end', () => {
                            console.log('Text watermarking completed');
                            resolve();
                        })
                        .on('error', (err) => {
                            console.error('Error during text watermarking:', err);
                            reject(err);
                        })
                        .run();
                });
            } else {
                // Try image watermark with a very simple approach
                try {
                    await new Promise<void>((resolve, reject) => {
                        // Position mapping for overlay
                        let overlayPos;
                        switch (position) {
                            case 'topLeft':
                                overlayPos = '10:10';
                                break;
                            case 'topRight':
                                overlayPos = 'main_w-overlay_w-10:10';
                                break;
                            case 'bottomLeft':
                                overlayPos = '10:main_h-overlay_h-10';
                                break;
                            case 'bottomRight':
                                overlayPos = 'main_w-overlay_w-10:main_h-overlay_h-10';
                                break;
                            case 'center':
                                overlayPos = '(main_w-overlay_w)/2:(main_h-overlay_h)/2';
                                break;
                        }

                        // Create a temporary scaled watermark first
                        const tempWatermarkPath = path.join(os.tmpdir(), `watermark-${Date.now()}.png`);

                        // Two-step process: first scale the watermark image
                        ffmpeg(watermarkImagePath)
                            .outputOptions(['-vf', `scale=iw*${scale}:-1`])
                            .output(tempWatermarkPath)
                            .on('end', () => {
                                console.log('Watermark scaled successfully');

                                // Then overlay the watermark on the video
                                ffmpeg(tempInputPath)
                                    .input(tempWatermarkPath)
                                    .complexFilter([
                                        `overlay=${overlayPos}`
                                    ])
                                    .outputOptions([
                                        '-codec:a copy',  // Copy audio codec
                                        '-q:v 1'          // High quality
                                    ])
                                    .output(tempOutputPath)
                                    .on('start', (commandLine) => {
                                        console.log(`FFmpeg overlay started: ${commandLine}`);
                                    })
                                    .on('progress', (progress) => {
                                        if (progress.percent) {
                                            console.log(`Overlay progress: ${Math.round(progress.percent)}% done`);
                                        }
                                    })
                                    .on('end', () => {
                                        console.log('Overlay completed');
                                        // Clean up the temporary watermark
                                        fs.unlink(tempWatermarkPath, () => { });
                                        resolve();
                                    })
                                    .on('error', (err) => {
                                        console.error('Error during overlay:', err);
                                        // Clean up the temporary watermark
                                        fs.unlink(tempWatermarkPath, () => { });
                                        reject(err);
                                    })
                                    .run();
                            })
                            .on('error', (err) => {
                                console.error('Error scaling watermark:', err);
                                reject(err);
                            })
                            .run();
                    });
                } catch (imageError) {
                    console.error('Image watermark failed, falling back to text watermark:', imageError);

                    // If image watermarking fails, fall back to text watermark
                    await new Promise<void>((resolve, reject) => {
                        ffmpeg(tempInputPath)
                            .videoFilters({
                                filter: 'drawtext',
                                options: {
                                    text: 'FreedomBook',
                                    fontsize: 24,
                                    fontcolor: 'white',
                                    x: 'w-tw-10',
                                    y: 'h-th-10',
                                    shadowcolor: 'black',
                                    shadowx: 2,
                                    shadowy: 2
                                }
                            })
                            .output(tempOutputPath)
                            .outputOptions([
                                '-codec:a copy',
                                '-q:v 1'
                            ])
                            .on('end', () => {
                                console.log('Fallback text watermarking completed');
                                resolve();
                            })
                            .on('error', (err) => {
                                console.error('Error during fallback text watermarking:', err);
                                reject(err);
                            })
                            .run();
                    });
                }
            }

            // 5. Read the processed file
            console.log(`Reading watermarked video...`);
            const processedBuffer = await fs.promises.readFile(tempOutputPath);

            // 6. Generate a unique filename for the watermarked video
            const originalFilename = decodeURIComponent(new URL(signedUrl).pathname.split('/').pop() || 'video');
            const fileNameWithoutExt = originalFilename.split('.')[0];
            const watermarkedFileName = `${fileNameWithoutExt}-watermarked-${Date.now()}.mp4`;

            // 7. Upload to S3
            console.log(`Uploading watermarked video to S3...`);
            const uploadResult = await this.uploadToS3(processedBuffer, watermarkedFileName, 'video/mp4');
            console.log(`Watermarked video uploaded to: ${uploadResult}`);

            // 8. Clean up temporary files
            console.log(`Cleaning up temporary files...`);
            await fs.promises.unlink(tempInputPath).catch(() => { });
            await fs.promises.unlink(tempOutputPath).catch(() => { });

            console.log(`Watermark process completed successfully`);

            if (shouldUpdatePost && postService && postDetails) {
                const updateData = { ...postDetails, media: [{ ...postDetails.media[0], watermarkUrl: uploadResult }] }
                console.log(postDetails, 'provided data')
                console.log(updateData, 'updating post with updated data')
                postService.updatePost(postDetails.postId, updateData)
                console.log('all done')
            }
            return uploadResult;
        } catch (error) {
            console.error('Error watermarking video:', error);
            throw error;
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

    private async createMediaConvertJob(inputPath: string, outputPath: string) {
        // Setup job parameters optimized for reels/social media
        const jobParams: any = {
            Role: process.env.AWS_MEDIACONVERT_ROLE,
            Settings: {
                Inputs: [
                    {
                        FileInput: inputPath,
                    },
                ],
                OutputGroups: [
                    {
                        Name: "Reel Output",
                        OutputGroupSettings: {
                            Type: "FILE_GROUP_SETTINGS",
                            FileGroupSettings: {
                                Destination: outputPath,
                            },
                        },
                        Outputs: [
                            {
                                // Remove the preset to avoid conflicts with our custom settings
                                // Preset: "System-Generic_Hd_Mp4_Avc_Aac_16x9_1280x720p_24Hz_4.5Mbps",
                                NameModifier: "-reel",
                                VideoDescription: {
                                    CodecSettings: {
                                        Codec: "H_264",
                                        H264Settings: {
                                            RateControlMode: "QVBR",
                                            QvbrSettings: {
                                                QvbrQualityLevel: 8,
                                                QvbrQualityLevelFineTune: 0,
                                            },
                                            MaxBitrate: 4500000,
                                            SceneChangeDetect: "TRANSITION_DETECTION",
                                            QualityTuningLevel: "MULTI_PASS_HQ",
                                            FramerateControl: "INITIALIZE_FROM_SOURCE",
                                            CodecProfile: "HIGH",
                                            GopSize: 60, // 2 seconds at 30fps, good for social media
                                            GopClosedCadence: 1,
                                            SpatialAdaptiveQuantization: "ENABLED",
                                            TemporalAdaptiveQuantization: "ENABLED",
                                            FlickerAdaptiveQuantization: "ENABLED",
                                        },
                                    },
                                    Width: 1080,  // Setting dimensions explicitly for social media format
                                    Height: 1920, // 9:16 aspect ratio for reels/stories
                                },
                                AudioDescriptions: [
                                    {
                                        CodecSettings: {
                                            Codec: "AAC",
                                            AacSettings: {
                                                Bitrate: 128000,
                                                CodecProfile: "LC",
                                                CodingMode: "CODING_MODE_2_0",
                                                SampleRate: 48000,
                                            },
                                        },
                                    },
                                ],
                                ContainerSettings: {
                                    Container: "MP4",
                                    Mp4Settings: {
                                        CslgAtom: "INCLUDE",
                                        FreeSpaceBox: "EXCLUDE",
                                        MoovPlacement: "PROGRESSIVE_DOWNLOAD",
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        };

        try {
            const command = new CreateJobCommand(jobParams);
            const response = await this.mediaConvertClient.send(command);
            console.log(`MediaConvert job created with ID: ${response.Job.Id}`);
            return response.Job.Id;
        } catch (error) {
            console.error('Error creating MediaConvert job:', error);
            throw error;
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