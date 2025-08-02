import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Media } from 'src/schema/media';
import { Model } from 'mongoose';
import { DetectModerationLabelsCommand, RekognitionClient } from '@aws-sdk/client-rekognition';
import { DetectDocumentTextCommand, TextractClient } from '@aws-sdk/client-textract';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import pdfParse from 'pdf-parse';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PostsService } from 'src/posts/posts.service';
import { lookup } from 'mime-types';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class UploadService {
    private rekognitionClient: RekognitionClient;
    private s3Client: S3Client;
    private textractClient: TextractClient;
    private bucketName: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        @InjectModel(Media.name) private mediaModel: Model<Media>
    ) {
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
        isReel: boolean = false,
    ) {
        let processedContent: Buffer;
        let moderationResult: { isSafe: boolean; labels: string[] } | string;

        try {
            if (contentType === 'image') {
                // Smart image type detection
                const detectedImageType = this.detectImageMimeType(file, originalname || fileName);

                // Check if image needs mobile optimization
                const shouldOptimize = await this.shouldOptimizeImage(file, originalname || fileName);

                let finalImageBuffer = file;
                let finalMimeType = detectedImageType;

                if (shouldOptimize) {
                    console.log('📸 Optimizing image for mobile devices...');
                    const optimizationResult = await this.optimizeImageForMobile(file, originalname || fileName);
                    finalImageBuffer = optimizationResult.optimizedBuffer;
                    finalMimeType = optimizationResult.finalMimeType;

                    // Mobile-optimized images are always under 5MB, perfect for Rekognition
                    console.log('✅ Mobile-optimized image ready for moderation and upload');
                } else {
                    console.log('✅ Image already mobile-optimized, using original');
                }

                // Direct moderation on final optimized image (no separate resizing needed)
                moderationResult = await this.moderateImage(finalImageBuffer);

                if (moderationResult.isSafe) {
                    const uploadResult = await this.uploadToS3(finalImageBuffer, fileName, finalMimeType);
                    return { url: uploadResult, fileName, fileType: contentType, originalname };
                } else {
                    throw new Error('Content violates moderation policies');
                }
            } else if (contentType === 'video') {
                const fileSizeInMB = file.length / (1024 * 1024);
                console.log(`📹 Processing video: ${fileSizeInMB.toFixed(2)} MB`);

                const shouldOptimize = await this.shouldOptimizeVideo(file, originalname || fileName);

                let finalVideoBuffer: Buffer;
                const finalContentType = 'video/mp4'; // Always MP4 after processing

                if (shouldOptimize) {
                    console.log(`🔄 Optimizing ${isReel ? 'reel' : 'normal video'} for mobile devices...`);
                    finalVideoBuffer = await this.optimizeVideoWithFFmpeg(file, fileName, isReel);
                } else {
                    console.log('✅ Video already mobile-optimized, skipping processing');
                    finalVideoBuffer = file;

                    // Ensure MP4 format for consistency
                    const originalFormat = await this.getVideoFormat(file);
                    if (originalFormat !== 'mp4') {
                        console.log('🔄 Converting to MP4 for mobile compatibility');
                        finalVideoBuffer = await this.convertToMp4Only(file, fileName);
                    }
                }

                const url = await this.uploadToS3(finalVideoBuffer, fileName, finalContentType);
                return { url, fileName, fileType: contentType, originalname };

            } else if (contentType === 'pdf') {
                processedContent = file;
                moderationResult = await this.moderatePdf(file);

                if (moderationResult.isSafe) {
                    const uploadResult = await this.uploadToS3(file, fileName, 'application/pdf');
                    return { url: uploadResult, fileName, fileType: contentType, originalname };
                } else {
                    throw new Error('Content violates moderation policies');
                }

            } else if (contentType === 'audio') {
                const detectedAudioType = this.detectAudioMimeType(file, originalname || fileName);
                const uploadResult = await this.uploadToS3(file, fileName, detectedAudioType);
                return { url: uploadResult, fileName, fileType: contentType };

            } else {
                console.log(contentType, 'contenttype');
                throw new Error('Unsupported file type');
            }

        } catch (error) {
            console.error('❌ Error processing content:', error);
            throw error;
        }
    }

    // Mobile compatibility checker
    private async checkMobileCompatibility(videoBuffer: Buffer): Promise<boolean> {
        try {
            const videoInfo = await this.getVideoInfo(videoBuffer);

            // Check mobile-specific requirements for both normal videos and reels
            const checks = {
                hasH264Codec: videoInfo.codec === 'h264',
                hasValidResolution: videoInfo.width <= 1280 && videoInfo.height <= 720, // 720p max for mobile optimization
                hasValidBitrate: videoInfo.bitrate <= 5000000, // 5Mbps max for mobile networks
                hasValidFramerate: true // Mobile devices handle up to 30fps efficiently
            };

            const isCompatible = Object.values(checks).every(check => check);
            return isCompatible;
        } catch (error) {
            return false; // Not compatible if we can't determine
        }
    }

    // Get detailed video information
    private async getVideoInfo(videoBuffer: Buffer): Promise<{
        format: string;
        duration: number;
        bitrate: number;
        width: number;
        height: number;
        codec: string;
    }> {
        return new Promise((resolve, reject) => {
            const inputStream = new Readable();
            inputStream.push(videoBuffer);
            inputStream.push(null);

            ffmpeg(inputStream).ffprobe((err, metadata) => {
                if (err) {
                    reject(err);
                    return;
                }

                const videoStream = metadata.streams.find(s => s.codec_type === 'video');

                resolve({
                    format: metadata.format.format_name?.split(',')[0] || 'unknown',
                    duration: metadata.format.duration || 0,
                    bitrate: metadata.format.bit_rate || 0,
                    width: videoStream?.width || 0,
                    height: videoStream?.height || 0,
                    codec: videoStream?.codec_name || 'unknown'
                });
            });
        });
    }

    // Get video format only
    private async getVideoFormat(videoBuffer: Buffer): Promise<string> {
        return new Promise((resolve, reject) => {
            const inputStream = new Readable();
            inputStream.push(videoBuffer);
            inputStream.push(null);

            ffmpeg(inputStream).ffprobe((err, metadata) => {
                if (err) {
                    reject(err);
                    return;
                }

                const format = metadata.format.format_name?.split(',')[0] || 'unknown';
                resolve(format);
            });
        });
    }

    // Convert to MP4 without heavy optimization (for already good videos)
    private async convertToMp4Only(file: Buffer, fileName: string): Promise<Buffer> {
        const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.tmp`);
        const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

        await fs.promises.writeFile(tempInputPath, file);

        return new Promise((resolve, reject) => {
            ffmpeg(tempInputPath)
                .outputOptions([
                    '-c:v copy',        // Copy video stream (no re-encoding)
                    '-c:a copy',        // Copy audio stream (no re-encoding)
                    '-movflags faststart',  // Web optimization
                    '-threads 2'
                ])
                .output(tempOutputPath)
                .on('end', async () => {
                    try {
                        const outputBuffer = await fs.promises.readFile(tempOutputPath);
                        await fs.promises.unlink(tempInputPath).catch(() => { });
                        await fs.promises.unlink(tempOutputPath).catch(() => { });
                        resolve(outputBuffer);
                    } catch (err) {
                        reject(err);
                    }
                })
                .on('error', async (err) => {
                    await fs.promises.unlink(tempInputPath).catch(() => { });
                    await fs.promises.unlink(tempOutputPath).catch(() => { });
                    reject(err);
                })
                .run();
        });
    }


    private async getVideoDuration(videoBuffer: Buffer): Promise<number> {
        console.log('⏱️ Getting video duration...');
        return new Promise((resolve, reject) => {
            const inputStream = new Readable();
            inputStream.push(videoBuffer);
            inputStream.push(null);

            ffmpeg(inputStream).ffprobe((err, metadata) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Get duration in seconds
                const duration = metadata.format.duration;
                resolve(duration);
            });
        });
    }

    // Smart image MIME type detection
    private detectImageMimeType(imageBuffer: Buffer, filename: string): string {
        // Check magic numbers (file signatures) first
        const signatures = [
            { signature: [0xFF, 0xD8, 0xFF], type: 'image/jpeg' },
            { signature: [0x89, 0x50, 0x4E, 0x47], type: 'image/png' },
            { signature: [0x47, 0x49, 0x46], type: 'image/gif' },
            { signature: [0x57, 0x45, 0x42, 0x50], type: 'image/webp' },
            { signature: [0x42, 0x4D], type: 'image/bmp' }
        ];

        for (const { signature, type } of signatures) {
            if (this.matchesSignature(imageBuffer, signature)) {
                return type;
            }
        }

        // Fallback to filename extension
        const mimeType = lookup(filename);
        if (mimeType && mimeType.startsWith('image/')) {
            return mimeType;
        }

        return 'image/jpeg'; // Safe default
    }

    // Smart audio MIME type detection
    private detectAudioMimeType(audioBuffer: Buffer, filename: string): string {
        // Check magic numbers for audio files
        const signatures = [
            { signature: [0xFF, 0xFB], type: 'audio/mpeg' }, // MP3
            { signature: [0xFF, 0xF3], type: 'audio/mpeg' }, // MP3
            { signature: [0xFF, 0xF2], type: 'audio/mpeg' }, // MP3
            { signature: [0x49, 0x44, 0x33], type: 'audio/mpeg' }, // MP3 with ID3
            { signature: [0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41], type: 'audio/mp4' }, // M4A
            { signature: [0x4F, 0x67, 0x67, 0x53], type: 'audio/ogg' }, // OGG
            { signature: [0x52, 0x49, 0x46, 0x46], type: 'audio/wav' } // WAV
        ];

        for (const { signature, type } of signatures) {
            if (this.matchesSignature(audioBuffer, signature)) {
                return type;
            }
        }

        // Fallback to filename extension
        const mimeType = lookup(filename);
        if (mimeType && mimeType.startsWith('audio/')) {
            return mimeType;
        }

        return 'audio/mpeg'; // Safe default
    }

    private matchesSignature(buffer: Buffer, signature: number[]): boolean {
        if (buffer.length < signature.length) return false;
        return signature.every((byte, index) => buffer[index] === byte);
    }

    async resizeImageForRekognition(imageBuffer: Buffer): Promise<Buffer> {
        try {
            // Get image metadata first to make informed decisions
            const metadata = await sharp(imageBuffer).metadata();
            console.log(`📸 Original image: ${metadata.width}x${metadata.height}, ${(imageBuffer.length / (1024 * 1024)).toFixed(2)}MB`);

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

            console.log(`📸 Resized to: ${(resizedBuffer.length / (1024 * 1024)).toFixed(2)}MB`);

            // If still too big, try more extreme measures
            if (resizedBuffer.length > 4.5 * 1024 * 1024) {
                resizedBuffer = await sharp(resizedBuffer)
                    .resize({ width: 500 })
                    .jpeg({ quality: 20 })
                    .toBuffer();
                console.log(`📸 Further resized to: ${(resizedBuffer.length / (1024 * 1024)).toFixed(2)}MB`);
            }

            return resizedBuffer;

        } catch (error) {
            console.error('❌ Error during image resizing:', error);
            throw new Error(`Failed to resize image: ${error.message}`);
        }
    }

    private async moderateImage(file: Buffer): Promise<{ isSafe: boolean; labels: string[] }> {
        const command = new DetectModerationLabelsCommand({
            Image: { Bytes: file },
            MinConfidence: 70,
        });

        try {
            const response = await this.rekognitionClient.send(command);
            const labels = response.ModerationLabels?.map(label => label.Name) || [];

            const allowedLabels = [
                'Corpse',
                'Dead Body',
                'Injury',
                'Corpses',
                'Violence',
                'Weapons',
                'Violence',
                'Weapon Violence',
                'Graphic Violence',
            ];

            const blockingLabels = response.ModerationLabels?.filter(label =>
                !allowedLabels.includes(label.Name)
            ) || [];

            return {
                isSafe: blockingLabels.length === 0,
                labels
            };
        } catch (error) {
            console.error('❌ Error in image moderation:', error);
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
            console.error('❌ Error in PDF moderation:', error);
            throw error;
        }
    }

    async uploadToS3(file: Buffer, key: string, contentType: string) {
        let fileName = encodeURIComponent(key);

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: file,
            ContentType: contentType, // Now correctly detected for all file types
            CacheControl: 'max-age=31536000', // 1 year cache for better CDN performance
        });

        try {
            await this.s3Client.send(command);
            const cloudFrontDomain = this.configService.get('CLOUDFRONT_DOMAIN');

            if (cloudFrontDomain) {
                return `${cloudFrontDomain}/${fileName}`;
            } else {
                // Fallback to S3 URL (but you should use CloudFront for better performance)
                return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
            }
        } catch (error) {
            console.error('❌ Error uploading to S3:', error);
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
            console.error('⚠️ Error deleting from S3:', error);
            // We're not throwing here to avoid breaking the main flow if deletion fails
        }
    }

    async uploadFile(filename: string, file: Buffer) {
        let fileName = encodeURIComponent(filename);
        let uploadedFile = await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: file,
        }));

        const cloudFrontDomain = this.configService.get('CLOUDFRONT_DOMAIN');
        if (cloudFrontDomain) {
            return `${cloudFrontDomain}/${fileName}`;
        } else {
            return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
        }
    }

    // Your existing watermark method (keeping as-is since it works perfectly)
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
            const opacity = options.opacity || 0.9;
            const scale = options.scale || 0.5;

            // Check if watermark image exists
            const imageExists = fs.existsSync(watermarkImagePath);

            if (!imageExists) {
                console.warn(`⚠️ Watermark image not found at ${watermarkImagePath}`);
                console.log(`Full path attempted: ${path.resolve(watermarkImagePath)}`);

                if (!options.text) {
                    options.text = 'FreedomBook'; // Fallback text
                }
            } else {
                console.log(`✅ Found watermark image at: ${watermarkImagePath}`);
            }

            console.log(`🎬 Starting watermark process for video: ${signedUrl}`);

            // 1. Download the video from the signed URL
            console.log(`📥 Downloading video from signed URL...`);
            const response = await fetch(signedUrl);
            if (!response.ok) {
                throw new Error(`Failed to download video: ${response.statusText}`);
            }
            const videoBuffer = Buffer.from(await response.arrayBuffer());
            console.log(`✅ Video downloaded, size: ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

            // 2. Create temporary files for processing
            const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.mp4`);
            const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

            // 3. Write the downloaded buffer to a temporary file
            await fs.promises.writeFile(tempInputPath, videoBuffer);
            console.log(`💾 Video saved to temporary file: ${tempInputPath}`);

            // 4. Apply watermark - text watermark is much more reliable, so we'll use that as a fallback
            console.log(`🎨 Using ${imageExists ? 'image' : 'text'} watermark...`);

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
                            '-q:v 1',          // High quality
                            '-threads 2'
                        ])
                        .on('start', (commandLine) => {
                            console.log(`🎬 FFmpeg text watermarking started: ${commandLine}`);
                        })
                        .on('progress', (progress) => {
                            if (progress.percent) {
                                console.log(`🔄 Watermarking progress: ${Math.round(progress.percent)}% done`);
                            }
                        })
                        .on('end', () => {
                            console.log('✅ Text watermarking completed');
                            resolve();
                        })
                        .on('error', (err) => {
                            console.error('❌ Error during text watermarking:', err);
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
                                console.log('✅ Watermark scaled successfully');

                                // Then overlay the watermark on the video
                                ffmpeg(tempInputPath)
                                    .input(tempWatermarkPath)
                                    .complexFilter([
                                        `overlay=${overlayPos}`
                                    ])
                                    .outputOptions([
                                        '-codec:a copy',  // Copy audio codec
                                        '-q:v 1',          // High quality
                                        '-threads 2'
                                    ])
                                    .output(tempOutputPath)
                                    .on('start', (commandLine) => {
                                        console.log(`🎬 FFmpeg overlay started: ${commandLine}`);
                                    })
                                    .on('progress', (progress) => {
                                        if (progress.percent) {
                                            console.log(`🔄 Overlay progress: ${Math.round(progress.percent)}% done`);
                                        }
                                    })
                                    .on('end', () => {
                                        console.log('✅ Overlay completed');
                                        // Clean up the temporary watermark
                                        fs.unlink(tempWatermarkPath, () => { });
                                        resolve();
                                    })
                                    .on('error', (err) => {
                                        console.error('❌ Error during overlay:', err);
                                        // Clean up the temporary watermark
                                        fs.unlink(tempWatermarkPath, () => { });
                                        reject(err);
                                    })
                                    .run();
                            })
                            .on('error', (err) => {
                                console.error('❌ Error scaling watermark:', err);
                                reject(err);
                            })
                            .run();
                    });
                } catch (imageError) {
                    console.error('❌ Image watermark failed, falling back to text watermark:', imageError);

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
                                console.log('✅ Fallback text watermarking completed');
                                resolve();
                            })
                            .on('error', (err) => {
                                console.error('❌ Error during fallback text watermarking:', err);
                                reject(err);
                            })
                            .run();
                    });
                }
            }

            // 5. Read the processed file
            console.log(`📖 Reading watermarked video...`);
            const processedBuffer = await fs.promises.readFile(tempOutputPath);

            // 6. Generate a unique filename for the watermarked video
            const originalFilename = decodeURIComponent(new URL(signedUrl).pathname.split('/').pop() || 'video');
            const fileNameWithoutExt = originalFilename.split('.')[0];
            const watermarkedFileName = `${fileNameWithoutExt}-watermarked-${Date.now()}.mp4`;

            // 7. Upload to S3
            console.log(`☁️ Uploading watermarked video to S3...`);
            const uploadResult = await this.uploadToS3(processedBuffer, watermarkedFileName, 'video/mp4');
            console.log(`✅ Watermarked video uploaded to: ${uploadResult}`);

            // 8. Clean up temporary files
            console.log(`🧹 Cleaning up temporary files...`);
            await fs.promises.unlink(tempInputPath).catch(() => { });
            await fs.promises.unlink(tempOutputPath).catch(() => { });

            console.log(`🎉 Watermark process completed successfully`);

            if (shouldUpdatePost && postService && postDetails) {
                const updateData = { ...postDetails, media: [{ ...postDetails.media[0], watermarkUrl: uploadResult }] };
                console.log(postDetails, 'provided data');
                console.log(updateData, 'updating post with updated data');
                postService.updatePost(postDetails.postId, updateData);
                console.log('✅ Post updated with watermarked video');
            }
            return uploadResult;
        } catch (error) {
            console.error('❌ Error watermarking video:', error);
            throw error;
        }
    }

    // ===== MOBILE-FIRST IMAGE OPTIMIZATION METHODS =====

    // Check if image needs mobile optimization
    private async shouldOptimizeImage(imageBuffer: Buffer, filename: string): Promise<boolean> {
        try {
            const metadata = await sharp(imageBuffer).metadata();
            const fileSizeInMB = imageBuffer.length / (1024 * 1024);

            // Mobile-first optimization checks
            const isLargeFile = fileSizeInMB > 1; // 1MB+ needs optimization
            const isHighResolution = (metadata.width || 0) > 1920 || (metadata.height || 0) > 1080;
            const isUnoptimizedFormat = !['jpeg', 'jpg', 'webp'].includes(metadata.format || '');
            const hasLowQuality = metadata.density && metadata.density > 150; // High DPI images

            const needsOptimization = isLargeFile || isHighResolution || isUnoptimizedFormat;

            if (!needsOptimization) {
                console.log('📸 Image already mobile-optimized:', {
                    format: metadata.format,
                    size: `${fileSizeInMB.toFixed(2)}MB`,
                    resolution: `${metadata.width}x${metadata.height}`,
                    optimized: true
                });
                return false;
            }

            console.log('🔧 Image needs mobile optimization:', {
                format: metadata.format,
                size: `${fileSizeInMB.toFixed(2)}MB`,
                resolution: `${metadata.width}x${metadata.height}`,
                isLargeFile,
                isHighResolution,
                isUnoptimizedFormat
            });

            return true;
        } catch (error) {
            console.log('⚠️ Error checking image info, will optimize for mobile compatibility:', error);
            return true; // Optimize if we can't determine
        }
    }

    // Mobile-first image optimization
    private async optimizeImageForMobile(imageBuffer: Buffer, filename: string): Promise<{
        optimizedBuffer: Buffer;
        finalMimeType: string;
        compressionStats: {
            originalSize: number;
            optimizedSize: number;
            reductionPercentage: number;
        };
    }> {
        try {
            const originalSizeInMB = imageBuffer.length / (1024 * 1024);
            const metadata = await sharp(imageBuffer).metadata();

            console.log(`📸 Starting mobile image optimization:`);
            console.log(`   Original: ${metadata.width}x${metadata.height}, ${originalSizeInMB.toFixed(2)}MB, ${metadata.format}`);

            // Mobile-optimized settings based on image size and usage
            const maxWidth = 1920;  // Max 1080p for mobile-web balance
            const maxHeight = 1080;
            let quality: number;
            let format: 'jpeg' | 'webp' = 'jpeg'; // Default to JPEG for universal compatibility

            // Adaptive quality based on file size (mobile-first approach)
            if (originalSizeInMB > 10) {
                quality = 70; // Aggressive compression for very large images
            } else if (originalSizeInMB > 5) {
                quality = 75; // Good compression for large images
            } else if (originalSizeInMB > 2) {
                quality = 80; // Moderate compression for medium images
            } else {
                quality = 85; // Light compression for smaller images
            }

            // Check if we should use WebP (better compression, but need JPEG fallback for old devices)
            const useWebP = this.shouldUseWebP(filename);
            if (useWebP) {
                format = 'webp';
                quality = Math.max(75, quality - 5); // WebP can use slightly lower quality for same visual result
            }

            // Optimize the image
            let sharpInstance = sharp(imageBuffer, { limitInputPixels: 100000000 })
                .resize({
                    width: maxWidth,
                    height: maxHeight,
                    fit: 'inside', // Maintain aspect ratio, never crop
                    withoutEnlargement: true // Don't upscale small images
                })
                .rotate(); // Auto-rotate based on EXIF data

            let optimizedBuffer: Buffer;
            let finalMimeType: string;

            if (format === 'webp') {
                optimizedBuffer = await sharpInstance
                    .webp({
                        quality: quality,
                        effort: 4, // Good compression vs speed balance
                        smartSubsample: true
                    })
                    .toBuffer();
                finalMimeType = 'image/webp';
            } else {
                optimizedBuffer = await sharpInstance
                    .jpeg({
                        quality: quality,
                        progressive: true, // Progressive JPEG for faster loading
                        mozjpeg: true, // Better compression
                        optimiseScans: true
                    })
                    .toBuffer();
                finalMimeType = 'image/jpeg';
            }

            const optimizedSizeInMB = optimizedBuffer.length / (1024 * 1024);
            const reductionPercentage = ((originalSizeInMB - optimizedSizeInMB) / originalSizeInMB) * 100;

            // Get final dimensions
            const optimizedMetadata = await sharp(optimizedBuffer).metadata();

            console.log(`✅ Mobile image optimization completed:`);
            console.log(`   Optimized: ${optimizedMetadata.width}x${optimizedMetadata.height}, ${optimizedSizeInMB.toFixed(2)}MB, ${format.toUpperCase()}`);
            console.log(`   Reduction: ${reductionPercentage.toFixed(1)}%`);

            // Warn if compression is very low (might indicate already optimized image)
            if (reductionPercentage < 20 && originalSizeInMB > 1) {
                console.log(`⚠️ Low compression ratio (${reductionPercentage.toFixed(1)}%) - image may already be optimized`);
            }

            return {
                optimizedBuffer,
                finalMimeType,
                compressionStats: {
                    originalSize: originalSizeInMB,
                    optimizedSize: optimizedSizeInMB,
                    reductionPercentage
                }
            };

        } catch (error) {
            console.error('❌ Error optimizing image for mobile:', error);
            throw new Error(`Failed to optimize image: ${error.message}`);
        }
    }

    // Determine if WebP should be used (consider browser support vs file size benefits)
    private shouldUseWebP(filename: string): boolean {
        // For now, stick with JPEG for universal compatibility
        // WebP can be added later as an advanced feature with fallbacks
        return false;
    }

    // Enhanced video optimization detection for TikTok and other pre-optimized videos
    private async shouldOptimizeVideo(videoBuffer: Buffer, filename: string): Promise<boolean> {
        try {
            const videoInfo = await this.getVideoInfo(videoBuffer);
            const fileSizeInMB = videoBuffer.length / (1024 * 1024);

            // Check if this looks like a TikTok or other highly-optimized video
            const isTikTokLike = await this.detectTikTokStyleVideo(videoInfo, fileSizeInMB, filename);

            if (isTikTokLike) {
                console.log('🎵 TikTok-style video detected - already highly optimized, skipping processing');
                return false;
            }

            // Enhanced optimization checks for regular videos
            const isAlreadyMp4 = videoInfo.format === 'mp4';
            const isSmallFile = fileSizeInMB < 10;
            const hasGoodBitrate = videoInfo.bitrate && videoInfo.bitrate < 4000000; // Less than 4Mbps
            const hasGoodResolution = videoInfo.width && videoInfo.width <= 1280; // Mobile-friendly 720p max for all videos
            const hasMobileCompatibleProfile = await this.checkMobileCompatibility(videoBuffer);
            const hasEfficientSizeRatio = this.checkVideoEfficiency(videoInfo, fileSizeInMB);

            // Don't optimize if all mobile-friendly conditions are met
            if (isAlreadyMp4 && isSmallFile && hasGoodBitrate && hasGoodResolution && hasMobileCompatibleProfile && hasEfficientSizeRatio) {
                console.log('📱 Video already mobile-optimized:', {
                    format: videoInfo.format,
                    size: `${fileSizeInMB.toFixed(2)}MB`,
                    bitrate: `${(videoInfo.bitrate / 1000000).toFixed(2)}Mbps`,
                    resolution: `${videoInfo.width}x${videoInfo.height}`,
                    mobileCompatible: hasMobileCompatibleProfile,
                    efficient: hasEfficientSizeRatio
                });
                return false;
            }

            console.log('🔧 Video needs mobile optimization:', {
                format: videoInfo.format,
                needsFormatChange: !isAlreadyMp4,
                isLargeFile: !isSmallFile,
                needsBitrateReduction: !hasGoodBitrate,
                needsResolutionReduction: !hasGoodResolution,
                needsMobileProfile: !hasMobileCompatibleProfile,
                inefficient: !hasEfficientSizeRatio,
                isTikTokLike
            });

            return true;
        } catch (error) {
            console.log('⚠️ Error checking video info, will optimize for mobile compatibility:', error);
            return true; // Optimize if we can't determine
        }
    }

    // Detect TikTok-style highly optimized videos
    private async detectTikTokStyleVideo(videoInfo: any, fileSizeInMB: number, filename: string): Promise<boolean> {
        try {
            // Common characteristics of TikTok/social media optimized videos
            const indicators = {
                // Size efficiency (very small for duration)
                isVeryEfficient: this.checkVideoEfficiency(videoInfo, fileSizeInMB, true),

                // Typical mobile resolutions used by TikTok
                hasTikTokResolution: this.checkTikTokResolution(videoInfo.width, videoInfo.height),

                // Typical TikTok bitrate ranges (very optimized)
                hasTikTokBitrate: this.checkTikTokBitrate(videoInfo.bitrate, fileSizeInMB),

                // Filename patterns (optional, might indicate source)
                hasSocialMediaPattern: this.checkSocialMediaFilename(filename),

                // Duration patterns (TikTok videos are typically short)
                hasShortDuration: videoInfo.duration && videoInfo.duration <= 180, // 3 minutes max

                // Already perfect mobile settings
                hasPerfectMobileSettings: videoInfo.codec === 'h264' && videoInfo.format === 'mp4'
            };

            // If multiple indicators suggest TikTok-style optimization, skip processing
            const positiveIndicators = Object.values(indicators).filter(Boolean).length;
            const isTikTokLike = positiveIndicators >= 3; // 3 or more indicators

            if (isTikTokLike) {
                console.log('🎵 TikTok-style video indicators:', {
                    ...indicators,
                    totalIndicators: positiveIndicators,
                    confidence: `${(positiveIndicators / 6 * 100).toFixed(0)}%`
                });
            }

            return isTikTokLike;

        } catch (error) {
            console.log('⚠️ Error detecting TikTok-style video:', error);
            return false; // Default to normal processing if detection fails
        }
    }

    // Check video size efficiency (bytes per second)
    private checkVideoEfficiency(videoInfo: any, fileSizeInMB: number, strict: boolean = false): boolean {
        if (!videoInfo.duration || videoInfo.duration <= 0) return false;

        const bytesPerSecond = (fileSizeInMB * 1024 * 1024) / videoInfo.duration;
        const kbytesPerSecond = bytesPerSecond / 1024;

        // TikTok videos are VERY efficient (usually 100-400 KB/second)
        // Regular efficient videos: 200-800 KB/second
        const threshold = strict ? 400 : 800; // KB/second

        const isEfficient = kbytesPerSecond < threshold;

        if (isEfficient) {
            console.log(`✅ Video is very efficient: ${kbytesPerSecond.toFixed(0)} KB/sec (threshold: ${threshold})`);
        }

        return isEfficient;
    }

    // Check typical TikTok/social media resolutions
    private checkTikTokResolution(width: number, height: number): boolean {
        if (!width || !height) return false;

        const commonTikTokResolutions = [
            { w: 720, h: 1280 },   // 9:16 portrait (most common)
            { w: 1080, h: 1920 },  // Full HD portrait
            { w: 540, h: 960 },    // Lower quality portrait
            { w: 480, h: 854 },    // Compressed portrait
            { w: 576, h: 1024 },   // Alternative portrait
            { w: 1280, h: 720 },   // 16:9 landscape (less common)
            { w: 720, h: 720 },    // Square (Instagram style)
            { w: 1080, h: 1080 }   // HD Square
        ];

        return commonTikTokResolutions.some(res =>
            (Math.abs(width - res.w) <= 10 && Math.abs(height - res.h) <= 10) ||
            (Math.abs(width - res.h) <= 10 && Math.abs(height - res.w) <= 10) // Rotated
        );
    }

    // Check typical TikTok bitrate patterns
    private checkTikTokBitrate(bitrate: number, fileSizeInMB: number): boolean {
        if (!bitrate || bitrate <= 0) return false;

        const bitrateKbps = bitrate / 1000;

        // TikTok typically uses 1-3 Mbps for mobile optimization
        // Very efficient encoding in this range
        const isTikTokRange = bitrateKbps >= 800 && bitrateKbps <= 3500;

        // Also check if bitrate seems very optimized for file size
        const expectedMinBitrate = (fileSizeInMB * 8 * 1000) / 180; // Assume max 3 min video
        const isVeryOptimized = bitrateKbps < expectedMinBitrate * 1.5;

        return isTikTokRange && isVeryOptimized;
    }

    // Check filename patterns that might indicate social media downloads
    private checkSocialMediaFilename(filename: string): boolean {
        const patterns = [
            /tiktok/i,
            /douyin/i,
            /instagram/i,
            /reels/i,
            /shorts/i,
            /snap/i,
            /social/i,
            /_\d{10,}/,  // Timestamp patterns
            /\d{4}-\d{2}-\d{2}/,  // Date patterns
            /download/i,
            /saved/i
        ];

        return patterns.some(pattern => pattern.test(filename));
    }

    // FIXED: Smart bitrate calculation to prevent size increases
    private async calculateOptimalBitrate(file: Buffer, fileSizeInMB: number, isReel: boolean): Promise<{
        compressionLevel: number;
        videoBitrate: string;
        audioBitrate: string;
        preset: string;
    }> {
        try {
            // Get original video info with robust error handling
            const videoInfo = await this.getVideoInfo(file);
            const originalBitrate = videoInfo.bitrate || 0;

            // Handle cases where bitrate detection fails
            let originalBitrateKbps = 0;
            if (originalBitrate && !isNaN(originalBitrate) && originalBitrate > 0) {
                originalBitrateKbps = Math.round(originalBitrate / 1000);
            } else {
                // Estimate bitrate based on file size and duration
                const duration = videoInfo.duration || 60; // Default 60 seconds if unknown
                const estimatedBitrate = (fileSizeInMB * 8 * 1024) / duration; // Kbps
                originalBitrateKbps = Math.round(estimatedBitrate);
                console.log(`⚠️ Could not detect original bitrate, estimated: ${originalBitrateKbps}kbps`);
            }

            console.log(`📊 Original video stats: ${fileSizeInMB.toFixed(2)}MB, ${originalBitrateKbps}kbps bitrate`);

            let compressionLevel, videoBitrate, audioBitrate, preset;

            if (isReel) {
                // Reels optimization with safe bitrate calculation
                if (fileSizeInMB > 30) {
                    compressionLevel = 28;
                    videoBitrate = this.calculateSafeBitrate(originalBitrateKbps, 1800, 0.7);
                    audioBitrate = '96k';
                    preset = 'veryfast';
                } else if (fileSizeInMB > 15) {
                    compressionLevel = 26;
                    videoBitrate = this.calculateSafeBitrate(originalBitrateKbps, 2200, 0.8);
                    audioBitrate = '96k';
                    preset = 'fast';
                } else {
                    compressionLevel = 24;
                    videoBitrate = this.calculateSafeBitrate(originalBitrateKbps, 2500, 0.9);
                    audioBitrate = '128k';
                    preset = 'faster';
                }
            } else {
                // Normal videos optimization with safe bitrate calculation
                if (fileSizeInMB > 100) {
                    compressionLevel = 28;
                    videoBitrate = this.calculateSafeBitrate(originalBitrateKbps, 3000, 0.6);
                    audioBitrate = '96k';
                    preset = 'veryfast';
                } else if (fileSizeInMB > 50) {
                    compressionLevel = 26;
                    videoBitrate = this.calculateSafeBitrate(originalBitrateKbps, 3500, 0.7);
                    audioBitrate = '128k';
                    preset = 'fast';
                } else if (fileSizeInMB > 20) {
                    compressionLevel = 24;
                    videoBitrate = this.calculateSafeBitrate(originalBitrateKbps, 4000, 0.8);
                    audioBitrate = '128k';
                    preset = 'faster';
                } else {
                    // Conservative for small files
                    compressionLevel = 22;
                    videoBitrate = this.calculateSafeBitrate(originalBitrateKbps, 3000, 0.9);
                    audioBitrate = '128k';
                    preset = 'medium';
                }
            }

            console.log(`🎯 Calculated optimal settings:`, {
                compressionLevel,
                videoBitrate,
                audioBitrate,
                preset,
                originalBitrate: `${originalBitrateKbps}k`
            });

            return { compressionLevel, videoBitrate, audioBitrate, preset };

        } catch (error) {
            console.log('⚠️ Error calculating optimal bitrate, using safe defaults:', error);

            // Robust fallback based on file size only
            if (isReel) {
                if (fileSizeInMB > 30) {
                    return { compressionLevel: 28, videoBitrate: '1800k', audioBitrate: '96k', preset: 'veryfast' };
                } else if (fileSizeInMB > 15) {
                    return { compressionLevel: 26, videoBitrate: '2200k', audioBitrate: '96k', preset: 'fast' };
                } else {
                    return { compressionLevel: 24, videoBitrate: '2000k', audioBitrate: '128k', preset: 'faster' };
                }
            } else {
                if (fileSizeInMB > 50) {
                    return { compressionLevel: 26, videoBitrate: '3000k', audioBitrate: '128k', preset: 'fast' };
                } else if (fileSizeInMB > 20) {
                    return { compressionLevel: 24, videoBitrate: '2500k', audioBitrate: '128k', preset: 'faster' };
                } else {
                    return { compressionLevel: 22, videoBitrate: '2000k', audioBitrate: '128k', preset: 'medium' };
                }
            }
        }
    }

    // Helper method for safe bitrate calculation
    private calculateSafeBitrate(originalBitrateKbps: number, maxBitrate: number, reductionFactor: number): string {
        // Handle edge cases
        if (!originalBitrateKbps || isNaN(originalBitrateKbps) || originalBitrateKbps <= 0) {
            // If we can't detect original bitrate, use conservative default
            const safeBitrate = Math.min(maxBitrate * 0.7, 2500); // 70% of max or 2.5Mbps, whichever is lower
            return Math.round(safeBitrate).toString() + 'k';
        }

        // Calculate target bitrate
        const targetBitrate = Math.min(maxBitrate, originalBitrateKbps * reductionFactor);

        // Ensure minimum reasonable bitrate (don't go too low)
        const minBitrate = 800; // 800kbps minimum
        const finalBitrate = Math.max(minBitrate, targetBitrate);

        return Math.round(finalBitrate).toString() + 'k';
    }


    // Update the main optimization method to handle TikTok videos gracefully
    private async optimizeVideoWithFFmpeg(file: Buffer, fileName: string, isReel: boolean = false): Promise<Buffer> {
        // Check one more time if this is a TikTok-style video that slipped through
        const videoInfo = await this.getVideoInfo(file);
        const fileSizeInMB = file.length / (1024 * 1024);

        const isTikTokLike = await this.detectTikTokStyleVideo(videoInfo, fileSizeInMB, fileName);

        if (isTikTokLike) {
            console.log('🎵 TikTok-style video detected during optimization - using minimal processing');
            return await this.minimalVideoProcessing(file, fileName);
        }

        // Continue with normal optimization for other videos
        const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.mp4`);
        const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

        await fs.promises.writeFile(tempInputPath, file);

        // Use smart bitrate calculation
        const optimalSettings = await this.calculateOptimalBitrate(file, fileSizeInMB, isReel);
        const { compressionLevel, videoBitrate, audioBitrate, preset } = optimalSettings;

        const maxWidth = isReel ? 720 : 1280;

        return new Promise((resolve, reject) => {
            const ffmpegCommand = ffmpeg(tempInputPath)
                .outputOptions([
                    `-c:v libx264`,
                    `-profile:v baseline`,
                    `-level 3.0`,
                    `-crf ${compressionLevel}`,
                    `-preset ${preset}`,
                    '-threads 2',
                    `-b:v ${videoBitrate}`,
                    `-maxrate ${videoBitrate}`,
                    `-bufsize ${parseInt(videoBitrate) * 2}k`,
                    `-c:a aac`,
                    `-b:a ${audioBitrate}`,
                    `-ar 44100`,
                    '-movflags +faststart',
                    '-pix_fmt yuv420p',
                    `-vf scale='min(${maxWidth},iw):-2'`,
                    '-g 30',
                    '-sc_threshold 0',
                    '-r 30'
                ])
                .output(tempOutputPath)
                .on('start', (commandLine) => {
                    console.log(`📱 Smart mobile-optimized FFmpeg started: ${commandLine}`);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`🔄 Smart encoding: ${Math.round(progress.percent)}% done`);
                    }
                })
                .on('end', async () => {
                    console.log('✅ Smart mobile video optimization completed');
                    try {
                        const outputBuffer = await fs.promises.readFile(tempOutputPath);
                        await fs.promises.unlink(tempInputPath).catch(() => { });
                        await fs.promises.unlink(tempOutputPath).catch(() => { });

                        const newSizeInMB = outputBuffer.length / (1024 * 1024);
                        const compressionRatio = (newSizeInMB / fileSizeInMB * 100);
                        const reductionPercentage = (100 - compressionRatio);

                        console.log(`📱 Smart optimization results:`);
                        console.log(`   Original: ${fileSizeInMB.toFixed(2)}MB`);
                        console.log(`   Optimized: ${newSizeInMB.toFixed(2)}MB`);
                        console.log(`   Change: ${reductionPercentage >= 0 ? '-' : '+'}${Math.abs(reductionPercentage).toFixed(1)}%`);
                        console.log(`   Type: ${isReel ? 'Reel (720p max)' : 'Normal (720p max)'}`);

                        // Warning if size increased
                        if (newSizeInMB > fileSizeInMB) {
                            console.log(`⚠️ WARNING: File size increased! This shouldn't happen with smart optimization.`);
                            console.log(`   Consider using original file or adjusting settings.`);
                        } else if (reductionPercentage < 10 && fileSizeInMB > 5) {
                            console.log(`ℹ️ Low compression (${reductionPercentage.toFixed(1)}%) - source was likely pre-optimized`);
                        } else {
                            console.log(`✅ Optimization successful: ${reductionPercentage.toFixed(1)}% reduction`);
                        }

                        resolve(outputBuffer);
                    } catch (err) {
                        reject(err);
                    }
                })
                .on('error', async (err) => {
                    console.error('❌ Smart FFmpeg error:', err);
                    await fs.promises.unlink(tempInputPath).catch(() => { });
                    await fs.promises.unlink(tempOutputPath).catch(() => { });
                    reject(err);
                })
                .run();
        });
    }

    // Minimal processing for TikTok-style videos (ensure MP4 format + compatibility)
    private async minimalVideoProcessing(file: Buffer, fileName: string): Promise<Buffer> {
        const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.mp4`);
        const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

        await fs.promises.writeFile(tempInputPath, file);

        // Check if it's already MP4 format
        const videoInfo = await this.getVideoInfo(file);
        const isAlreadyMp4 = videoInfo.format === 'mp4';

        return new Promise((resolve, reject) => {
            if (isAlreadyMp4) {
                // Already MP4 - just copy streams + ensure web optimization
                ffmpeg(tempInputPath)
                    .outputOptions([
                        '-c:v copy',           // Copy video stream (no re-encoding)
                        '-c:a copy',           // Copy audio stream (no re-encoding)
                        '-movflags +faststart', // Web optimization
                        '-threads 2'
                    ])
                    .output(tempOutputPath)
                    .on('start', () => {
                        console.log('🎵 TikTok MP4: Copy streams only (preserve quality)');
                    })
                    .on('end', async () => {
                        try {
                            const outputBuffer = await fs.promises.readFile(tempOutputPath);
                            await fs.promises.unlink(tempInputPath).catch(() => { });
                            await fs.promises.unlink(tempOutputPath).catch(() => { });

                            console.log('✅ TikTok MP4: Quality preserved, web-optimized');
                            resolve(outputBuffer);
                        } catch (err) {
                            reject(err);
                        }
                    })
                    .on('error', async (err) => {
                        await fs.promises.unlink(tempInputPath).catch(() => { });
                        await fs.promises.unlink(tempOutputPath).catch(() => { });
                        reject(err);
                    })
                    .run();
            } else {
                // Not MP4 - convert to MP4 with minimal quality loss
                ffmpeg(tempInputPath)
                    .outputOptions([
                        '-c:v libx264',        // Re-encode to H.264 (for MP4)
                        '-profile:v baseline', // Mobile compatibility
                        '-level 3.0',          // Mobile compatibility
                        '-crf 18',             // Very high quality (minimal loss)
                        '-preset medium',      // Good quality/speed balance
                        '-threads 2',
                        '-c:a aac',            // Re-encode audio to AAC
                        '-b:a 128k',           // Good audio quality
                        '-movflags +faststart', // Web optimization
                        '-pix_fmt yuv420p'     // iOS compatibility

                    ])
                    .output(tempOutputPath)
                    .on('start', () => {
                        console.log(`🎵 TikTok ${videoInfo.format?.toUpperCase()}: Converting to MP4 with minimal quality loss`);
                    })
                    .on('progress', (progress) => {
                        if (progress.percent) {
                            console.log(`🔄 TikTok conversion: ${Math.round(progress.percent)}% done`);
                        }
                    })
                    .on('end', async () => {
                        try {
                            const outputBuffer = await fs.promises.readFile(tempOutputPath);
                            await fs.promises.unlink(tempInputPath).catch(() => { });
                            await fs.promises.unlink(tempOutputPath).catch(() => { });

                            const originalSize = file.length / (1024 * 1024);
                            const newSize = outputBuffer.length / (1024 * 1024);
                            console.log(`✅ TikTok conversion completed: ${originalSize.toFixed(2)}MB → ${newSize.toFixed(2)}MB`);

                            resolve(outputBuffer);
                        } catch (err) {
                            reject(err);
                        }
                    })
                    .on('error', async (err) => {
                        await fs.promises.unlink(tempInputPath).catch(() => { });
                        await fs.promises.unlink(tempOutputPath).catch(() => { });
                        reject(err);
                    })
                    .run();
            }
        });
    }
}