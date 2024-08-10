import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PostsService } from "./posts.service";
import { MediaService } from "src/media/media.service";
import { Types } from 'mongoose'
import { ChatGateway } from "src/chat/chat.gateway";
import { PageService } from "src/pages/pages.service";

@Injectable()
export class UploadListener {
    constructor(
        private readonly postsService: PostsService,
        private readonly pageService: PageService,
        private readonly mediaService: MediaService,
        private readonly chatGateway: ChatGateway
    ) { }
    @OnEvent("files.uploaded")
    async handleFlesUploadedEvent({ uploadPromise, postId, targetId }: {
        uploadPromise: any,
        postId: string,
        targetId: Types.ObjectId
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


            const postDetails = { media: postMedia, isUploaded: true }
            console.log(postDetails, postId, targetId, 'meda upload consumer')
            await this.postsService.updatePost(postId, postDetails);
            await this.mediaService.storeMedia(targetId, media)
            await this.chatGateway.uploadSuccess({isSuccess: true})
        } catch (error) {
            console.error(`Error uploading media for post ${postId}:`, error);
            await this.postsService.deletePost(postId);
            await this.chatGateway.uploadSuccess({isSuccess: false})
        }
    }

    @OnEvent("page.profiles.upload")
    async handleProfilesUpload({ uploadPromise, targetId, images }: {
        uploadPromise: any,
        targetId: string,
        images?: { profile?: string, cover?: string }
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
    
            console.log(images, targetId, files)
            await this.pageService.updatePage(targetId, {images: {...images, ..._images}, isUploaded: null});
            await this.chatGateway.uploadSuccess({isSuccess: true, target: {
                type: "page",
                targetId,
            }})
        } catch (error) {
            console.error(`Error uploading media for page ${targetId}:`, error);
            await this.chatGateway.uploadSuccess({isSuccess: false})
        }
    }
}