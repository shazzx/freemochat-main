import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Media } from 'src/schema/media';
import { Model } from 'mongoose';
import { DetectLabelsCommand, DetectModerationLabelsCommand, RekognitionClient } from '@aws-sdk/client-rekognition';
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
import { ValidationResult } from 'src/schema/validation/post';
import { EnvironmentalContributionType } from 'src/schema/validation/post';

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
    private readonly VALIDATION_CONFIG = {
        plantation: {
            requiredLabels: [
                'Plant', 'Tree', 'Vegetation', 'Flora', 'Leaf', 'Branch', 'Trunk', 'Root',
                'Sapling', 'Seedling', 'Bush', 'Shrub', 'Flower', 'Blossom', 'Stem',
                'Garden', 'Landscape', 'Grass', 'Lawn', 'Agriculture', 'Farm', 'Crop', 'Grove', 'Orchard',
                'Soil', 'Earth', 'Ground', 'Dirt', 'Gardening', 'Planting', 'Planted Area',
                'Shovel', 'Spade', 'Gardening Tool', 'Watering Can', 'Pot', 'Planter'
            ],
            conflictingLabels: [
                'Building', 'Architecture', 'Urban', 'City', 'Road', 'Vehicle', 'Car',
                'Electronics', 'Computer', 'Phone', 'Screen', 'Indoor', 'Furniture',
                'Garbage', 'Trash', 'Waste', 'Water Tank', 'Container'
            ],
            minConfidence: 75,
            description: 'actual tree planting or vegetation cultivation by the user'
        },
        garbage_collection: {
            requiredLabels: [
                'Trash Can', 'Garbage Can', 'Dumpster', 'Bin', 'Container', 'Waste Container',
                'Recycle Bin', 'Dustbin', 'Garbage Bin', 'Waste Bin',
                'Collection Point', 'Waste Management', 'Recycling Station',
                'Bag', 'Plastic Bag', 'Collection Bag', 'Waste Collection',
                'Cleaning', 'Collection', 'Street', 'Park', 'Public Space', 'Cleanup',
                'Plastic', 'Metal', 'Recycling', 'Waste Sorting'
            ],
            conflictingLabels: [
                'Plant', 'Tree', 'Vegetation', 'Clean Nature', 'Pristine Environment',
                'Water', 'Pool', 'Lake', 'River', 'Swimming'
            ],
            minConfidence: 70,
            description: 'garbage collection boxes or waste management systems placed by the user'
        },
        water_ponds: {
            requiredLabels: [
                'Pond', 'Water Body', 'Basin', 'Reservoir', 'Tank', 'Water Storage',
                'Artificial Pond', 'Man-made Water Body',
                'Construction', 'Excavation', 'Concrete', 'Stone', 'Rock', 'Built Structure',
                'Water Conservation', 'Storage System', 'Water Management',
                'Dam', 'Barrier', 'Wall', 'Channel', 'Water Infrastructure',
                'Water', 'Reflection', 'Waterhole', 'Lagoon',
                'Excavation', 'Earth Work', 'Construction Equipment'
            ],
            conflictingLabels: [
                'Swimming Pool', 'Hot Tub', 'Bathtub', 'Sink', 'Bathroom', 'Kitchen',
                'Indoor', 'Decorative Fountain', 'Ornamental Water'
            ],
            minConfidence: 70,
            description: 'water pond or water conservation structure created by the user'
        },
        rain_water: {
            requiredLabels: [
                'Tank', 'Water Tank', 'Storage Tank', 'Container', 'Barrel', 'Storage',
                'Reservoir', 'Cistern', 'Water Storage', 'Collection Tank',
                'Collection System', 'Harvesting System', 'Water Collection',
                'Gutter', 'Pipe', 'Drainage', 'Channel', 'Spout', 'Downspout',
                'Collector', 'Filter', 'Rain Collection',
                'Installation', 'Equipment', 'Infrastructure', 'Water System',
                'Construction', 'Building', 'Structure', 'Setup',
                'Roof', 'Rooftop Collection', 'Catchment'
            ],
            conflictingLabels: [
                'Swimming Pool', 'Hot Tub', 'Bathroom', 'Kitchen', 'Indoor Plumbing',
                'Decorative', 'Fountain', 'Ornamental', 'Jacuzzi'
            ],
            minConfidence: 70,
            description: 'rainwater harvesting or storage system created/installed by the user'
        }
    };

    async validateEnvironmentalImage(
        imageBuffer: Buffer,
        claimedType: EnvironmentalContributionType
    ): Promise<ValidationResult> {
        try {
            const labels = await this.detectImageLabels(imageBuffer);
            const validation = this.validateAgainstType(labels, claimedType);

            if (!validation.isValid) {
                validation.suggestedCategory = this.suggestCorrectCategory(labels);
            }

            return validation;

        } catch (error) {
            return {
                isValid: true,
                confidence: 0,
                detectedLabels: [],
                reason: 'Validation service temporarily unavailable'
            };
        }
    }

    private async detectImageLabels(imageBuffer: Buffer): Promise<any[]> {
        const command = new DetectLabelsCommand({
            Image: { Bytes: imageBuffer },
            MaxLabels: 50, 
            MinConfidence: 60,
        });

        const response = await this.rekognitionClient.send(command);
        return response.Labels || [];
    }

    private validateAgainstType(
        detectedLabels: any[],
        claimedType: EnvironmentalContributionType
    ): ValidationResult {
        const config = this.VALIDATION_CONFIG[claimedType];
        const labelNames = detectedLabels.map(label => label.Name);
        const labelConfidences = detectedLabels.reduce((acc, label) => {
            acc[label.Name] = label.Confidence;
            return acc;
        }, {} as Record<string, number>);

        const conflicts = config.conflictingLabels.filter(conflictLabel =>
            labelNames.some(detectedLabel =>
                detectedLabel.toLowerCase().includes(conflictLabel.toLowerCase()) ||
                conflictLabel.toLowerCase().includes(detectedLabel.toLowerCase())
            )
        );

        if (conflicts.length > 0) {
            const conflictConfidences = conflicts.map(conflict =>
                Math.max(...labelNames
                    .filter(label =>
                        label.toLowerCase().includes(conflict.toLowerCase()) ||
                        conflict.toLowerCase().includes(label.toLowerCase())
                    )
                    .map(label => labelConfidences[label] || 0)
                )
            );
            const maxConflictConfidence = Math.max(...conflictConfidences);

            if (maxConflictConfidence > 80) {
                return {
                    isValid: false,
                    confidence: maxConflictConfidence,
                    detectedLabels: labelNames,
                    reason: `Image doesn't show evidence of ${config.description}. Detected: ${conflicts.join(', ')}`
                };
            }
        }

        
        const matchedLabels = config.requiredLabels.filter(requiredLabel =>
            labelNames.some(detectedLabel =>
                detectedLabel.toLowerCase().includes(requiredLabel.toLowerCase()) ||
                requiredLabel.toLowerCase().includes(detectedLabel.toLowerCase()) ||
                this.isSemanticMatch(detectedLabel, requiredLabel)
            )
        );

        if (matchedLabels.length === 0) {
            return {
                isValid: false,
                confidence: 0,
                detectedLabels: labelNames,
                reason: `Image doesn't show evidence of ${config.description}. Please ensure image shows the environmental action you performed.`
            };
        }

        
        const matchConfidences = matchedLabels.map(matchedLabel => {
            const correspondingDetectedLabels = labelNames.filter(detectedLabel =>
                detectedLabel.toLowerCase().includes(matchedLabel.toLowerCase()) ||
                matchedLabel.toLowerCase().includes(detectedLabel.toLowerCase()) ||
                this.isSemanticMatch(detectedLabel, matchedLabel)
            );
            return Math.max(...correspondingDetectedLabels.map(label => labelConfidences[label] || 0));
        });

        const avgConfidence = matchConfidences.reduce((sum, conf) => sum + conf, 0) / matchConfidences.length;

        
        const isValid = avgConfidence >= config.minConfidence && matchedLabels.length >= 1;

        return {
            isValid,
            confidence: Math.round(avgConfidence),
            detectedLabels: labelNames,
            reason: isValid
                ? `Image verified as evidence of ${config.description} with ${matchedLabels.length} relevant elements detected`
                : `Low confidence (${Math.round(avgConfidence)}%) for ${config.description}. Need ${config.minConfidence}% minimum confidence.`
        };
    }

    private suggestCorrectCategory(detectedLabels: any[]): EnvironmentalContributionType | undefined {
        const labelNames = detectedLabels.map(label => label.Name);
        const scores: Record<EnvironmentalContributionType, number> = {
            plantation: 0,
            garbage_collection: 0,
            water_ponds: 0,
            rain_water: 0
        };

        
        Object.keys(this.VALIDATION_CONFIG).forEach(type => {
            const config = this.VALIDATION_CONFIG[type as EnvironmentalContributionType];
            const matches = config.requiredLabels.filter(requiredLabel =>
                labelNames.some(detectedLabel =>
                    detectedLabel.toLowerCase().includes(requiredLabel.toLowerCase()) ||
                    requiredLabel.toLowerCase().includes(detectedLabel.toLowerCase())
                )
            );
            scores[type as EnvironmentalContributionType] = matches.length;
        });

        
        const maxScore = Math.max(...Object.values(scores));
        if (maxScore > 0) {
            return Object.keys(scores).find(
                key => scores[key as EnvironmentalContributionType] === maxScore
            ) as EnvironmentalContributionType;
        }

        return undefined;
    }

    private isSemanticMatch(detected: string, required: string): boolean {
        const semanticGroups = {
            plants: ['plant', 'tree', 'vegetation', 'flora', 'leaf', 'branch', 'trunk', 'bush', 'shrub'],
            water: ['water', 'liquid', 'pond', 'lake', 'pool', 'reservoir', 'tank'],
            waste: ['trash', 'garbage', 'waste', 'litter', 'rubbish', 'debris'],
            containers: ['container', 'bin', 'tank', 'barrel', 'can', 'bucket']
        };

        const detectedLower = detected.toLowerCase();
        const requiredLower = required.toLowerCase();

        for (const group of Object.values(semanticGroups)) {
            if (group.includes(detectedLower) && group.includes(requiredLower)) {
                return true;
            }
        }

        return false;
    }

    async moderateAndValidateEnvironmentalImage(
        imageBuffer: Buffer,
        claimedType: EnvironmentalContributionType
    ): Promise<{
        isSafe: boolean;
        isValidType: boolean;
        confidence: number;
        moderationLabels: string[];
        validationReason?: string;
        suggestedCategory?: EnvironmentalContributionType;
    }> {
        
        const [moderationResult, validationResult] = await Promise.all([
            this.moderateImage(imageBuffer),
            this.validateEnvironmentalImage(imageBuffer, claimedType)
        ]);

        return {
            isSafe: moderationResult.isSafe,
            isValidType: validationResult.isValid,
            confidence: validationResult.confidence,
            moderationLabels: moderationResult.labels,
            validationReason: validationResult.reason,
            suggestedCategory: validationResult.suggestedCategory
        };
    }

    async processAndUploadContent(
        file: Buffer,
        fileName: string,
        contentType: string,
        originalname?: string,
        isReel: boolean = false,
        
        environmentalType?: EnvironmentalContributionType,
        skipEnvironmentalValidation: boolean = false
    ) {
        let processedContent: Buffer;
        let moderationResult: { isSafe: boolean; labels: string[] } | string;

        try {
            if (contentType === 'image') {
                
                const detectedImageType = this.detectImageMimeType(file, originalname || fileName);

                
                const shouldOptimize = await this.shouldOptimizeImage(file, originalname || fileName);

                let finalImageBuffer = file;
                let finalMimeType = detectedImageType;

                if (shouldOptimize) {
                    console.log('📸 Optimizing image for mobile devices...');
                    const optimizationResult = await this.optimizeImageForMobile(file, originalname || fileName);
                    finalImageBuffer = optimizationResult.optimizedBuffer;
                    finalMimeType = optimizationResult.finalMimeType;

                } 

                
                if (environmentalType && !skipEnvironmentalValidation) {
                    console.log(`🌱 Validating image for ${environmentalType} contribution...`);

                    const validationResult = await this.moderateAndValidateEnvironmentalImage(
                        finalImageBuffer,
                        environmentalType
                    );

                    
                    if (!validationResult.isSafe) {
                        throw new Error(`Content violates moderation policies: ${validationResult.moderationLabels.join(', ')}`);
                    }

                    if (!validationResult.isValidType) {
                        let errorMessage = `Image does not appear to show ${environmentalType} activity.`;

                        if (validationResult.suggestedCategory) {
                            errorMessage += ` Did you mean to select "${validationResult.suggestedCategory}" instead?`;
                        }

                        throw new BadRequestException(errorMessage);
                    }

                } else {
                    
                    moderationResult = await this.moderateImage(finalImageBuffer);

                    if (!moderationResult.isSafe) {
                        throw new Error('Content violates moderation policies');
                    }
                }

                const uploadResult = await this.uploadToS3(finalImageBuffer, fileName, finalMimeType);
                return { url: uploadResult, fileName, fileType: contentType, originalname };

            } else if (contentType === 'video') {
                const fileSizeInMB = file.length / (1024 * 1024);
                console.log(`📹 Processing video: ${fileSizeInMB.toFixed(2)} MB`);

                const shouldOptimize = await this.shouldOptimizeVideo(file, originalname || fileName);

                let finalVideoBuffer: Buffer;
                const finalContentType = 'video/mp4';

                if (shouldOptimize) {
                    console.log(`🔄 Optimizing ${isReel ? 'reel' : 'normal video'} for mobile devices...`);
                    finalVideoBuffer = await this.optimizeVideoWithFFmpeg(file, fileName, isReel);
                } else {
                    finalVideoBuffer = file;

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
                

                
                
                

                const uploadResult = await this.uploadToS3(file, fileName, 'application/pdf');
                return { url: uploadResult, fileName, fileType: contentType, originalname };

            } else if (contentType === 'audio') {
                const detectedAudioType = this.detectAudioMimeType(file, originalname || fileName);
                const uploadResult = await this.uploadToS3(file, fileName, detectedAudioType);
                return { url: uploadResult, fileName, fileType: contentType };

            } else {
                throw new Error('Unsupported file type');
            }

        } catch (error) {
            throw error;
        }
    }


    
    private async checkMobileCompatibility(videoBuffer: Buffer): Promise<boolean> {
        try {
            const videoInfo = await this.getVideoInfo(videoBuffer);

            
            const checks = {
                hasH264Codec: videoInfo.codec === 'h264',
                hasValidResolution: videoInfo.width <= 1280 && videoInfo.height <= 720, 
                hasValidBitrate: videoInfo.bitrate <= 5000000, 
                hasValidFramerate: true 
            };

            const isCompatible = Object.values(checks).every(check => check);
            return isCompatible;
        } catch (error) {
            return false; 
        }
    }

    
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

    
    private async convertToMp4Only(file: Buffer, fileName: string): Promise<Buffer> {
        const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.tmp`);
        const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

        await fs.promises.writeFile(tempInputPath, file);

        return new Promise((resolve, reject) => {
            ffmpeg(tempInputPath)
                .outputOptions([
                    '-c:v copy',        
                    '-c:a copy',        
                    '-movflags faststart',  
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

                
                const duration = metadata.format.duration;
                resolve(duration);
            });
        });
    }

    
    private detectImageMimeType(imageBuffer: Buffer, filename: string): string {
        
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

        
        const mimeType = lookup(filename);
        if (mimeType && mimeType.startsWith('image/')) {
            return mimeType;
        }

        return 'image/jpeg'; 
    }

    
    private detectAudioMimeType(audioBuffer: Buffer, filename: string): string {
        
        const signatures = [
            { signature: [0xFF, 0xFB], type: 'audio/mpeg' }, 
            { signature: [0xFF, 0xF3], type: 'audio/mpeg' }, 
            { signature: [0xFF, 0xF2], type: 'audio/mpeg' }, 
            { signature: [0x49, 0x44, 0x33], type: 'audio/mpeg' }, 
            { signature: [0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41], type: 'audio/mp4' }, 
            { signature: [0x4F, 0x67, 0x67, 0x53], type: 'audio/ogg' }, 
            { signature: [0x52, 0x49, 0x46, 0x46], type: 'audio/wav' } 
        ];

        for (const { signature, type } of signatures) {
            if (this.matchesSignature(audioBuffer, signature)) {
                return type;
            }
        }

        
        const mimeType = lookup(filename);
        if (mimeType && mimeType.startsWith('audio/')) {
            return mimeType;
        }

        return 'audio/mpeg'; 
    }

    private matchesSignature(buffer: Buffer, signature: number[]): boolean {
        if (buffer.length < signature.length) return false;
        return signature.every((byte, index) => buffer[index] === byte);
    }

    async resizeImageForRekognition(imageBuffer: Buffer): Promise<Buffer> {
        try {
            
            const metadata = await sharp(imageBuffer).metadata();
            console.log(`📸 Original image: ${metadata.width}x${metadata.height}, ${(imageBuffer.length / (1024 * 1024)).toFixed(2)}MB`);

            
            const maxDimension = Math.max(metadata.width || 0, metadata.height || 0);
            let targetWidth, targetHeight, quality;

            if (maxDimension > 4000) {
                
                targetWidth = 600;
                quality = 30;
            } else if (maxDimension > 2000) {
                
                targetWidth = 800;
                quality = 40;
            } else {
                
                targetWidth = 1000;
                quality = 50;
            }

            
            let resizedBuffer = await sharp(imageBuffer, { limitInputPixels: 100000000 })
                .resize({ width: targetWidth, withoutEnlargement: true })
                .jpeg({ quality: quality })
                .toBuffer();

            console.log(`📸 Resized to: ${(resizedBuffer.length / (1024 * 1024)).toFixed(2)}MB`);

            
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
            ContentType: contentType, 
            CacheControl: 'max-age=31536000', 
        });

        try {
            await this.s3Client.send(command);
            const cloudFrontDomain = this.configService.get('CLOUDFRONT_DOMAIN');

            if (cloudFrontDomain) {
                return `${cloudFrontDomain}/${fileName}`;
            } else {
                
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
        }
    }

    async deleteMultipleFromS3(keys: string[]) {
        if (keys.length === 0) return;

        const command = new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
                Objects: keys.map(key => ({ Key: key })),
                Quiet: true
            }
        });

        try {
            const result = await this.s3Client.send(command);
            return result;
        } catch (error) {
            await this.fallbackIndividualDeletes(keys);
        }
    }

    private async fallbackIndividualDeletes(keys: string[]): Promise<void> {
        const deletePromises = keys.map(key =>
            this.deleteFromS3(key).catch(error => {
                console.error(`Failed to delete ${key}:`, error);
                return null;
            })
        );

        await Promise.allSettled(deletePromises);
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
        const fetch = require('node-fetch');

        try {
            const defaultImagePath = path.join(__dirname, '..', '..', 'assets', 'freemochat-logo.png');
            const watermarkImagePath = options.watermarkImagePath || defaultImagePath;

            const position = options.position || 'bottomRight';
            const scale = options.scale || 0.5;

            const imageExists = fs.existsSync(watermarkImagePath);

            if (!imageExists) {
                if (!options.text) {
                    options.text = 'Freemochat';
                }
            } 

            const response = await fetch(signedUrl);
            if (!response.ok) {
                throw new Error(`Failed to download video: ${response.statusText}`);
            }
            const videoBuffer = Buffer.from(await response.arrayBuffer());
            const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.mp4`);
            const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

            await fs.promises.writeFile(tempInputPath, videoBuffer);

            if (!imageExists || options.text) {
                await new Promise<void>((resolve, reject) => {
                    const text = options.text || 'Freemochat';
                    const fontSize = options.fontSize || 24;
                    const fontColor = options.fontColor || 'white';

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
                            '-codec:a copy', 
                            '-q:v 1',       
                            '-threads 2'
                        ])
                        // .on('start', (commandLine) => {
                        //     console.log(`🎬 FFmpeg text watermarking started: ${commandLine}`);
                        // })
                        // .on('progress', (progress) => {
                        //     if (progress.percent) {
                        //         console.log(`🔄 Watermarking progress: ${Math.round(progress.percent)}% done`);
                        //     }
                        // })
                        .on('end', () => {
                            resolve();
                        })
                        .on('error', (err) => {
                            reject(err);
                        })
                        .run();
                });
            } else {
                try {
                    await new Promise<void>((resolve, reject) => {
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

                        const tempWatermarkPath = path.join(os.tmpdir(), `watermark-${Date.now()}.png`);

                        ffmpeg(watermarkImagePath)
                            .outputOptions(['-vf', `scale=iw*${scale}:-1`])
                            .output(tempWatermarkPath)
                            .on('end', () => {
                                ffmpeg(tempInputPath)
                                    .input(tempWatermarkPath)
                                    .complexFilter([
                                        `overlay=${overlayPos}`
                                    ])
                                    .outputOptions([
                                        '-codec:a copy', 
                                        '-q:v 1',       
                                        '-threads 2'
                                    ])
                                    .output(tempOutputPath)
                                    // .on('start', (commandLine) => {
                                    //     console.log(`🎬 FFmpeg overlay started: ${commandLine}`);
                                    // })
                                    // .on('progress', (progress) => {
                                    //     if (progress.percent) {
                                    //         console.log(`🔄 Overlay progress: ${Math.round(progress.percent)}% done`);
                                    //     }
                                    // })
                                    .on('end', () => {
                                        fs.unlink(tempWatermarkPath, () => { });
                                        resolve();
                                    })
                                    .on('error', (err) => {
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
                    await new Promise<void>((resolve, reject) => {
                        ffmpeg(tempInputPath)
                            .videoFilters({
                                filter: 'drawtext',
                                options: {
                                    text: 'Freemochat',
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
                                resolve();
                            })
                            .on('error', (err) => {
                                reject(err);
                            })
                            .run();
                    });
                }
            }

            const processedBuffer = await fs.promises.readFile(tempOutputPath);
            const originalFilename = decodeURIComponent(new URL(signedUrl).pathname.split('/').pop() || 'video');
            const fileNameWithoutExt = originalFilename.split('.')[0];
            const watermarkedFileName = `${fileNameWithoutExt}-watermarked-${Date.now()}.mp4`;
            const uploadResult = await this.uploadToS3(processedBuffer, watermarkedFileName, 'video/mp4');

            await fs.promises.unlink(tempInputPath).catch(() => { });
            await fs.promises.unlink(tempOutputPath).catch(() => { });

            if (shouldUpdatePost && postService && postDetails) {
                const updateData = { ...postDetails, media: [{ ...postDetails.media[0], watermarkUrl: uploadResult }] };
                postService.updatePost(postDetails.postId, updateData);
            }
            return uploadResult;
        } catch (error) {
            throw error;
        }
    }

    private async shouldOptimizeImage(imageBuffer: Buffer, filename: string): Promise<boolean> {
        try {
            const metadata = await sharp(imageBuffer).metadata();
            const fileSizeInMB = imageBuffer.length / (1024 * 1024);

            const isLargeFile = fileSizeInMB > 1;
            const isHighResolution = (metadata.width || 0) > 1920 || (metadata.height || 0) > 1080;
            const isUnoptimizedFormat = !['jpeg', 'jpg', 'webp'].includes(metadata.format || '');

            const needsOptimization = isLargeFile || isHighResolution || isUnoptimizedFormat;

            if (!needsOptimization) {
                return false;
            }

            return true;
        } catch (error) {
            return true;
        }
    }

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
            const maxWidth = 1920; 
            const maxHeight = 1080;
            let quality: number;
            let format: 'jpeg' | 'webp' = 'jpeg';

            if (originalSizeInMB > 10) {
                quality = 70;
            } else if (originalSizeInMB > 5) {
                quality = 75;
            } else if (originalSizeInMB > 2) {
                quality = 80;
            } else {
                quality = 85;
            }

            const useWebP = this.shouldUseWebP(filename);
            if (useWebP) {
                format = 'webp';
                quality = Math.max(75, quality - 5);
            }

            let sharpInstance = sharp(imageBuffer, { limitInputPixels: 100000000 })
                .resize({
                    width: maxWidth,
                    height: maxHeight,
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .rotate();

            let optimizedBuffer: Buffer;
            let finalMimeType: string;

            if (format === 'webp') {
                optimizedBuffer = await sharpInstance
                    .webp({
                        quality: quality,
                        effort: 4,
                        smartSubsample: true
                    })
                    .toBuffer();
                finalMimeType = 'image/webp';
            } else {
                optimizedBuffer = await sharpInstance
                    .jpeg({
                        quality: quality,
                        progressive: true,
                        mozjpeg: true,
                        optimiseScans: true
                    })
                    .toBuffer();
                finalMimeType = 'image/jpeg';
            }

            const optimizedSizeInMB = optimizedBuffer.length / (1024 * 1024);
            const reductionPercentage = ((originalSizeInMB - optimizedSizeInMB) / originalSizeInMB) * 100;

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
            throw new Error(`Failed to optimize image: ${error.message}`);
        }
    }

    private shouldUseWebP(filename: string): boolean {
        return false;
    }

    private async shouldOptimizeVideo(videoBuffer: Buffer, filename: string): Promise<boolean> {
        try {
            const videoInfo = await this.getVideoInfo(videoBuffer);
            const fileSizeInMB = videoBuffer.length / (1024 * 1024);
            const isTikTokLike = await this.detectTikTokStyleVideo(videoInfo, fileSizeInMB, filename);

            if (isTikTokLike) {
                return false;
            }

            const isAlreadyMp4 = videoInfo.format === 'mp4';
            const isSmallFile = fileSizeInMB < 10;
            const hasGoodBitrate = videoInfo.bitrate && videoInfo.bitrate < 4000000;
            const hasGoodResolution = videoInfo.width && videoInfo.width <= 1280;
            const hasMobileCompatibleProfile = await this.checkMobileCompatibility(videoBuffer);
            const hasEfficientSizeRatio = this.checkVideoEfficiency(videoInfo, fileSizeInMB);

            if (isAlreadyMp4 && isSmallFile && hasGoodBitrate && hasGoodResolution && hasMobileCompatibleProfile && hasEfficientSizeRatio) {
                return false;
            }

            return true;
        } catch (error) {
            return true;
        }
    }

    private async detectTikTokStyleVideo(videoInfo: any, fileSizeInMB: number, filename: string): Promise<boolean> {
        try {
            const indicators = {
                isVeryEfficient: this.checkVideoEfficiency(videoInfo, fileSizeInMB, true),
                hasTikTokResolution: this.checkTikTokResolution(videoInfo.width, videoInfo.height),
                hasTikTokBitrate: this.checkTikTokBitrate(videoInfo.bitrate, fileSizeInMB),
                hasSocialMediaPattern: this.checkSocialMediaFilename(filename),
                hasShortDuration: videoInfo.duration && videoInfo.duration <= 180,
                hasPerfectMobileSettings: videoInfo.codec === 'h264' && videoInfo.format === 'mp4'
            };

            const positiveIndicators = Object.values(indicators).filter(Boolean).length;
            const isTikTokLike = positiveIndicators >= 3;

            return isTikTokLike;

        } catch (error) {
            return false;
        }
    }

    private checkVideoEfficiency(videoInfo: any, fileSizeInMB: number, strict: boolean = false): boolean {
        if (!videoInfo.duration || videoInfo.duration <= 0) return false;

        const bytesPerSecond = (fileSizeInMB * 1024 * 1024) / videoInfo.duration;
        const kbytesPerSecond = bytesPerSecond / 1024;
        const threshold = strict ? 400 : 800;
        const isEfficient = kbytesPerSecond < threshold;

        return isEfficient;
    }

    private checkTikTokResolution(width: number, height: number): boolean {
        if (!width || !height) return false;

        const commonTikTokResolutions = [
            { w: 720, h: 1280 },  
            { w: 1080, h: 1920 }, 
            { w: 540, h: 960 },   
            { w: 480, h: 854 },   
            { w: 576, h: 1024 },  
            { w: 1280, h: 720 },  
            { w: 720, h: 720 },   
            { w: 1080, h: 1080 }
        ];

        return commonTikTokResolutions.some(res =>
            (Math.abs(width - res.w) <= 10 && Math.abs(height - res.h) <= 10) ||
            (Math.abs(width - res.h) <= 10 && Math.abs(height - res.w) <= 10)
        );
    }

    private checkTikTokBitrate(bitrate: number, fileSizeInMB: number): boolean {
        if (!bitrate || bitrate <= 0) return false;

        const bitrateKbps = bitrate / 1000;
        const isTikTokRange = bitrateKbps >= 800 && bitrateKbps <= 3500;
        const expectedMinBitrate = (fileSizeInMB * 8 * 1000) / 180;
        const isVeryOptimized = bitrateKbps < expectedMinBitrate * 1.5;

        return isTikTokRange && isVeryOptimized;
    }

    private checkSocialMediaFilename(filename: string): boolean {
        const patterns = [
            /tiktok/i,
            /douyin/i,
            /instagram/i,
            /reels/i,
            /shorts/i,
            /snap/i,
            /social/i,
            /_\d{10,}/, 
            /\d{4}-\d{2}-\d{2}/,
            /download/i,
            /saved/i
        ];

        return patterns.some(pattern => pattern.test(filename));
    }

    private async calculateOptimalBitrate(file: Buffer, fileSizeInMB: number, isReel: boolean): Promise<{
        compressionLevel: number;
        videoBitrate: string;
        audioBitrate: string;
        preset: string;
    }> {
        try {
            const videoInfo = await this.getVideoInfo(file);
            const originalBitrate = videoInfo.bitrate || 0;

            let originalBitrateKbps = 0;
            if (originalBitrate && !isNaN(originalBitrate) && originalBitrate > 0) {
                originalBitrateKbps = Math.round(originalBitrate / 1000);
            } else {
                const duration = videoInfo.duration || 60;
                const estimatedBitrate = (fileSizeInMB * 8 * 1024) / duration;
                originalBitrateKbps = Math.round(estimatedBitrate);
            }

            let compressionLevel, videoBitrate, audioBitrate, preset;

            if (isReel) {
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
                    compressionLevel = 22;
                    videoBitrate = this.calculateSafeBitrate(originalBitrateKbps, 3000, 0.9);
                    audioBitrate = '128k';
                    preset = 'medium';
                }
            }

            return { compressionLevel, videoBitrate, audioBitrate, preset };

        } catch (error) {
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

    private calculateSafeBitrate(originalBitrateKbps: number, maxBitrate: number, reductionFactor: number): string {
        if (!originalBitrateKbps || isNaN(originalBitrateKbps) || originalBitrateKbps <= 0) {
            const safeBitrate = Math.min(maxBitrate * 0.7, 2500);
            return Math.round(safeBitrate).toString() + 'k';
        }

        const targetBitrate = Math.min(maxBitrate, originalBitrateKbps * reductionFactor);

        const minBitrate = 800;
        const finalBitrate = Math.max(minBitrate, targetBitrate);

        return Math.round(finalBitrate).toString() + 'k';
    }

    private async optimizeVideoWithFFmpeg(file: Buffer, fileName: string, isReel: boolean = false): Promise<Buffer> {
        const videoInfo = await this.getVideoInfo(file);
        const fileSizeInMB = file.length / (1024 * 1024);
        const isTikTokLike = await this.detectTikTokStyleVideo(videoInfo, fileSizeInMB, fileName);

        if (isTikTokLike) {
            return await this.minimalVideoProcessing(file, fileName);
        }

        const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.mp4`);
        const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

        await fs.promises.writeFile(tempInputPath, file);

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
                .on('end', async () => {
                    try {
                        const outputBuffer = await fs.promises.readFile(tempOutputPath);
                        await fs.promises.unlink(tempInputPath).catch(() => { });
                        await fs.promises.unlink(tempOutputPath).catch(() => { });

                        const newSizeInMB = outputBuffer.length / (1024 * 1024);
                        const compressionRatio = (newSizeInMB / fileSizeInMB * 100);

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

    private async minimalVideoProcessing(file: Buffer, fileName: string): Promise<Buffer> {
        const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.mp4`);
        const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

        await fs.promises.writeFile(tempInputPath, file);

        const videoInfo = await this.getVideoInfo(file);
        const isAlreadyMp4 = videoInfo.format === 'mp4';

        return new Promise((resolve, reject) => {
            if (isAlreadyMp4) {
                ffmpeg(tempInputPath)
                    .outputOptions([
                        '-c:v copy',
                        '-c:a copy',
                        '-movflags +faststart',
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
            } else {
                ffmpeg(tempInputPath)
                    .outputOptions([
                        '-c:v libx264',
                        '-profile:v baseline',
                        '-level 3.0',         
                        '-crf 18',            
                        '-preset medium',     
                        '-threads 2',
                        '-c:a aac',           
                        '-b:a 128k',          
                        '-movflags +faststart',
                        '-pix_fmt yuv420p'    

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
            }
        });
    }
}