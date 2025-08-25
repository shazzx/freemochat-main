import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PostsService } from "./posts.service";
import { MediaService } from "src/media/media.service";
import { Types } from 'mongoose'
import { ChatGateway } from "src/chat/chat.gateway";
import { PageService } from "src/pages/pages.service";
import { GroupsService } from "src/groups/groups.service";
import { UploadService } from "src/upload/upload.service";
import { MessageService } from "src/message/message.service";
import { CGroupsService } from "src/cgroups/cgroups.service";
import * as os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs-extra';
import path from 'path';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class UploadListener {
    constructor(
        private readonly postsService: PostsService,
        private readonly pageService: PageService,
        private readonly groupsService: GroupsService,
        private readonly chatgroupsService: CGroupsService,
        private readonly mediaService: MediaService,
        private readonly chatGateway: ChatGateway,
        private readonly uploadService: UploadService,
        private readonly messageService: MessageService,
    ) { }
    @OnEvent("files.uploaded")
    async handleFlesUploadedEvent({ uploadPromise, postId, targetId, type, uploadType, _postData }: {
        uploadPromise: any,
        postId: string,
        targetId: Types.ObjectId,
        type: string
        uploadType?: string
        _postData?: any
    }) {
        try {
            const files = await Promise.all(uploadPromise);

            let media = { images: [], videos: [] };
            let postMedia = [];

            for (let file of files) {
                if (file.fileType == 'video') {
                    media.videos.push(file.url);
                    postMedia.push({
                        type: 'video',
                        url: file.url,
                        location: file.location, // 🔧 ADD THIS
                        capturedAt: file.location ? new Date() : undefined // 🔧 ADD THIS
                    });
                }
                if (file.fileType == 'image') {
                    media.images.push(file.url);
                    postMedia.push({
                        type: 'image',
                        url: file.url,
                        location: file.location, // 🔧 ADD THIS
                        capturedAt: file.location ? new Date() : undefined // 🔧 ADD THIS
                    });
                }
            }

            if (uploadType == 'update') {

                const removeMedia = {
                    images: [],
                    videos: []
                }


                if (_postData.media.length > 0) {
                    const { media } = _postData
                    for (let file in media) {
                        if (media[file].remove) {
                            let imageUrlSplit = media[file].url.split("/")
                            console.log(`deleting ${imageUrlSplit} from s3...`)
                            let filename = imageUrlSplit[imageUrlSplit.length - 1]
                            await this.uploadService.deleteFromS3(filename)
                        }
                    }
                }

                _postData.media.forEach((_media) => {
                    if (!_media?.remove && _media.type == 'video') {
                        postMedia.push({ type: 'video', url: _media.url })
                    }
                    if (!_media?.remove && _media.type == 'image') {
                        postMedia.push({ type: 'image', url: _media.url })
                    }
                    if (_media?.remove && _media.type == 'video') {
                        removeMedia.videos.push(_media.url)
                    }
                    if (_media?.remove && _media.type == 'image') {
                        removeMedia.images.push(_media.url)
                    }
                })

                const postDetails = { media: postMedia, isUploaded: null }
                await this.mediaService.storeMedia(new Types.ObjectId(targetId), media)
                await this.mediaService.removeMedia(new Types.ObjectId(targetId), removeMedia)
                await this.postsService.updatePost(postId, postDetails);
                await this.chatGateway.uploadSuccess({
                    isSuccess: true, target: {
                        isUpdate: true,
                        targetId,
                        type,
                        invalidate: "posts"
                    }
                })
                return
            }

            const postDetails = { media: postMedia, isUploaded: null }
            await this.postsService.updatePost(postId, postDetails);
            await this.mediaService.storeMedia(targetId, media)
            await this.chatGateway.uploadSuccess({
                isSuccess: true, target: {
                    targetId,
                    type,
                    invalidate: "posts"
                }
            })
        } catch (error) {
            console.error(`Error uploading media for post ${postId}:`, error);
            if (uploadType !== 'update') {
                await this.postsService.deletePost(postId);
            }

            await this.chatGateway.uploadSuccess({
                isSuccess: false, target: {
                    targetId,
                    type,
                    error,
                    invalidate: "posts"
                }
            })
        }
    }

    // @OnEvent("reel.upload")
    // async handleReelUploadEvent({ uploadPromise, postId, targetId, type, uploadType }: {
    //     uploadPromise: any,
    //     postId: string,
    //     targetId: Types.ObjectId,
    //     type: string
    //     uploadType?: string
    //     _postData?: any
    // }) {
    //     try {
    //         const videos = await Promise.all(uploadPromise)

    //         let postMedia = []
    //         for (let video of videos) {
    //             if (video.fileType == 'video') {
    //                 postMedia.push({ type: 'video', url: video.url })
    //             }
    //         }

    //         const postDetails = { media: postMedia, isUploaded: null }
    //         await this.postsService.updatePost(postId, postDetails);
    //         await this.chatGateway.uploadSuccess({
    //             isSuccess: true, target: {
    //                 targetId,
    //                 type,
    //                 invalidate: "reels"
    //             }
    //         })
    //     } catch (error) {
    //         console.error(`Error uploading media for post ${postId}:`, error);
    //         if (uploadType !== 'update') {
    //             await this.postsService.deletePost(postId);
    //         }

    //         await this.chatGateway.uploadSuccess({
    //             isSuccess: false, target: {
    //                 targetId,
    //                 type,
    //                 error,
    //                 invalidate: "reels"
    //             }
    //         })
    //     }
    // }

    @OnEvent("reel.upload")
    async handleReelUploadEvent({
        uploadPromise,
        postId,
        targetId,
        type,
        uploadType,
        fileBuffer,
        filename,
        _media
    }) {
        try {
            // Wait for video upload to complete
            const videos = await Promise.all(uploadPromise);

            let postMedia = [];
            for (let video of videos) {
                if (video.fileType == 'video') {
                    postMedia.push({ type: 'video', url: video.url });
                }
            }


            const thumbnail = await this.generateAndUploadThumbnail(postId, fileBuffer, filename, targetId, type);
            const media = [{ ...postMedia[0], thumbnail: thumbnail.url }]
            const postDetails = { media, isUploaded: null }
            await this.postsService.updatePost(postId, postDetails);
            if (_media && _media?.length > 0) {
                _media.forEach(async (media) => {
                    if (media.url) {
                        let videoUrlSplit = media?.url?.split("/")
                        let thumbnailUrlSplit = media?.thumbnail?.split("/")
                        let watermarkUrlSplit = media?.watermarkUrl?.split("/")

                        console.log(`deleting ${videoUrlSplit}, ${thumbnailUrlSplit}, ${watermarkUrlSplit} from s3...`)

                        let videoFilename = videoUrlSplit?.[videoUrlSplit?.length - 1]
                        let thumbnailFilename = thumbnailUrlSplit?.[thumbnailUrlSplit?.length - 1]
                        let watermarkedVideoFilename = watermarkUrlSplit?.[watermarkUrlSplit?.length - 1]

                        console.log(videoFilename, thumbnailFilename, watermarkedVideoFilename, 'filenames')

                        console.log(`deleting ${videoFilename} from s3...`)

                        if (videoFilename) {
                            const video = await this.uploadService.deleteFromS3(videoFilename)
                            console.log(video.$metadata.httpStatusCode)
                        }

                        if (thumbnailFilename) {
                            const thumbnail = await this.uploadService.deleteFromS3(thumbnailFilename)
                            console.log(`deleting ${thumbnailFilename} from s3...`)
                            console.log(thumbnail.$metadata.httpStatusCode)
                        }

                        if (watermarkedVideoFilename) {
                            const watermarkVideo = await this.uploadService.deleteFromS3(watermarkedVideoFilename)
                            console.log(`deleting ${watermarkedVideoFilename} from s3...`)
                            console.log(watermarkVideo.$metadata.httpStatusCode, 'deleted')
                        }
                    }
                })
            }
            await this.chatGateway.uploadSuccess({
                isSuccess: true, target: {
                    targetId,
                    type,
                    invalidate: "reels"
                }
            })

            this.uploadService.watermarkVideoFromSignedUrl(postMedia[0].url, {}, true, this.postsService, { postId, ...postDetails, media })
            console.log('All Proccesing Completed')
        } catch (error) {
            console.error(`Error uploading media for post ${postId}:`, error);

            if (uploadType !== 'update') {
                await this.postsService.deletePost(postId);
            }

            await this.chatGateway.uploadSuccess({
                isSuccess: false,
                target: {
                    targetId,
                    type,
                    error,
                    invalidate: "reels"
                }
            });
        }
    }

    // Generate and upload thumbnail
    private async generateAndUploadThumbnail(
        postId: string,
        videoBuffer: Buffer,
        filename: string,
        targetId: Types.ObjectId,
        type: string
    ) {
        try {
            // Generate thumbnail from video
            const thumbnailBuffer = await this.extractThumbnail(videoBuffer);

            if (!thumbnailBuffer) {
                console.warn('Could not generate thumbnail for video');

                // Still notify success even if thumbnail fails
                await this.chatGateway.uploadSuccess({
                    isSuccess: true,
                    target: {
                        targetId,
                        type,
                        invalidate: "reels"
                    }
                });

                return;
            }

            // Upload thumbnail to storage
            const thumbnailFilename = `${filename}_thumbnail`;
            const thumbnail = await this.uploadService.processAndUploadContent(
                thumbnailBuffer,
                thumbnailFilename,
                'image',
                `${thumbnailFilename}.jpg`
            );

            return thumbnail
        } catch (error) {
            console.error(`Error generating thumbnail for post ${postId}:`, error);
        }
    }

    // Extract thumbnail from video using fluent-ffmpeg
    private async extractThumbnail(videoBuffer: Buffer): Promise<Buffer> {
        return new Promise<Buffer>(async (resolve, reject) => {
            try {
                // Create temporary directories and files
                const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reel-thumb-'));
                const videoPath = path.join(tempDir, 'video.mp4');
                const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');

                // Write video buffer to temporary file
                await fs.writeFile(videoPath, videoBuffer);

                // Use fluent-ffmpeg to extract thumbnail
                ffmpeg(videoPath)
                    .on('error', async (err) => {
                        console.error('Error generating thumbnail:', err);
                        await fs.remove(tempDir).catch(e => console.error('Error cleaning temp dir:', e));
                        resolve(null); // Return null instead of rejecting to continue the flow
                    })
                    .on('end', async () => {
                        try {
                            // Read the thumbnail file
                            const thumbnailBuffer = await fs.readFile(thumbnailPath);

                            // Clean up temp directory
                            await fs.remove(tempDir).catch(e => console.error('Error cleaning temp dir:', e));

                            resolve(thumbnailBuffer);
                        } catch (readError) {
                            console.error('Error reading thumbnail:', readError);
                            await fs.remove(tempDir).catch(e => console.error('Error cleaning temp dir:', e));
                            resolve(null);
                        }
                    })
                    .screenshots({
                        timestamps: ['15%'], // Take screenshot at 15% of the video duration
                        filename: 'thumbnail.jpg',
                        folder: tempDir,
                        size: '640x?', // 640px width, maintain aspect ratio
                    });
            } catch (err) {
                console.error('Error in thumbnail extraction:', err);
                resolve(null); // Return null instead of rejecting to continue the flow
            }
        });
    }



    @OnEvent("profiles.upload")
    async handleProfilesUpload({ uploadPromise, targetId, type }: {
        uploadPromise: any,
        targetId: string,
        type: string,
    }) {
        try {
            const files = await Promise.all(uploadPromise)

            let _images;
            for (let file of files) {
                if (file.originalname == 'profile') {
                    _images = { ..._images, profile: file.url }
                }
                if (file.originalname == 'cover') {
                    _images = { ..._images, cover: file.url }
                }
            }

            console.log(_images)

            if (type == 'group') {
                await this.groupsService.updateGroup(targetId, { ..._images, isUploaded: null });
                await this.chatGateway.uploadSuccess({
                    isSuccess: true, target: {
                        type: "group",
                        targetId,
                    }
                })
            }


            if (type == 'chatgroup') {
                await this.chatgroupsService.updateGroup(targetId, { ..._images, isUploaded: null });
                await this.chatGateway.uploadSuccess({
                    isSuccess: true, target: {
                        type: "group",
                        targetId,
                    }
                })
            }

            if (type == 'page') {
                console.log(targetId, files, 'page', targetId)
                await this.pageService.updatePage(targetId, { ..._images, isUploaded: null });
                await this.chatGateway.uploadSuccess({
                    isSuccess: true, target: {
                        type: "page",
                        targetId,
                    }
                })
            }

        } catch (error) {
            console.error(`Error uploading media for page ${targetId}:`, error);
            await this.chatGateway.uploadSuccess({ isSuccess: false })
        }
    }


    @OnEvent("messageMedia.upload")
    async handleMessageMediaUpload({ uploadPromise, messageId, messageDetails, userId }: {
        uploadPromise: any,
        messageId: string,
        userId: string,
        messageDetails: { type: string, content: string, messageType: string, sender: Types.ObjectId, recepient: Types.ObjectId, media?: { url: string, type?: string, duration?: number } }
    }) {
        try {
            const file = await Promise.all(uploadPromise)
            console.log(file[0].url, file[0].fileType)
            let messageUpdate = await this.messageService.updateMessage(messageId, { media: { ...messageDetails.media, url: file[0].url, type: file[0].fileType, isUploaded: true } })
            console.log(messageUpdate)
            await this.chatGateway.sendMessage({ ...messageDetails, media: { ...messageDetails.media, url: file[0].url, isUploaded: true } })
            console.log('success', messageDetails)
            await this.chatGateway.uploadSuccess({
                isSuccess: true, target: {
                    targetId: messageDetails.sender,
                    recepient: messageDetails.recepient,
                    type: "messages",
                    invalidate: "messages",
                    messageId
                }
            })
        } catch (error) {
            console.error(`Error uploading media for message ${messageId}:`, error);
            await this.messageService.removeMessage(messageDetails.recepient.toString(), userId, messageId, messageDetails.sender.toString())
        }
    }

    @OnEvent("files.delete")
    async handleDeleteMultipleFiles({ filenames }: { filenames: string[] }) {
        for (const filename of filenames) {
            try {
                await this.uploadService.deleteFromS3(filename);
                console.log(`✅ Deleted: ${filename}`);
            } catch (error) {
                console.error(`❌ Delete failed: ${filename}`, error.message);
            }
        }
    }
}