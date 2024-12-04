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
            const files = await Promise.all(uploadPromise)

            let media = {
                images: [],
                videos: []
            }

            let postMedia = []
            for (let file of files) {
                if (file.fileType == 'video') {
                    media.videos.push(file.url)
                    postMedia.push({ type: 'video', url: file.url })
                }
                if (file.fileType == 'image') {
                    media.images.push(file.url)
                    postMedia.push({ type: 'image', url: file.url })
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

            await this.chatGateway.uploadSuccess({ isSuccess: false, target: {
                targetId,
                type,
                error,
                invalidate: "posts"
            } })
        }
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
    async handleMessageMediaUpload({ uploadPromise, messageId, messageDetails, userId}: {
        uploadPromise: any,
        messageId: string,
        userId: string,
        messageDetails: { type: string, content: string, messageType: string, sender: Types.ObjectId, recepient: Types.ObjectId, media?: { url: string, type?: string, duration?: number} }
    }) {
        try {
            const file = await Promise.all(uploadPromise)
            console.log(file[0].url, file[0].fileType)
            let messageUpdate = await this.messageService.updateMessage(messageId, { media: {...messageDetails.media, url: file[0].url, type: file[0].fileType, isUploaded: true } })
            console.log(messageUpdate)
            await this.chatGateway.sendMessage({...messageDetails, media: {...messageDetails.media, url: file[0].url, isUploaded: true }})
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
            await this.messageService.removeMessage(userId, messageId)
        }
    }
}