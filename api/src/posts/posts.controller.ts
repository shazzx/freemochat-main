import { BadRequestException, Body, Controller, Get, Post, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { PostsService } from './posts.service';
import { Response } from 'express';
import { Types } from 'mongoose'
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';
import { v4 as uuidv4 } from 'uuid'
import { getFileType } from 'src/utils/getFileType';
import { MediaService } from 'src/media/media.service';
import { Public } from 'src/auth/public.decorator';
import Stripe from 'stripe';
import stripe from 'src/utils/stripe.session';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Process } from '@nestjs/bull';

import { OnQueueEvent } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { BookmarkPost, BookmarkPostDTO, CreatePost, CreatePostDTO, DeletePost, DeletePostDTO, GetPost, GetPromotions, GetPromotionsDTO, LikeCommentOrReply, LikeCommentOrReplyDTO, LikePost, LikePostDTO, PromotePost, PromotePostDTO, PromotionActivation, PromotionActivationDTO, ReportPost, ReportPostDTO, UpdatePost, UpdatePostDTO, ViewPost, ViewPostDTO } from 'src/schema/validation/post';
import { Request } from 'types/global';
import { Cursor, CursorDTO } from 'src/schema/validation/global';
import { z } from 'zod';

// @Processor('media-upload')
// export class MediaUploadConsumer extends WorkerHost {
//     constructor(
//         private readonly postsService: PostsService,
//         private readonly uploadService: UploadService,
//         private readonly mediaService: MediaService
//     ) {
//         super()
//     }

//     @OnQueueEvent('active')
//     onActive(job: Job) {
//         console.log(
//             `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
//         );
//     }

//     @Process("media")
//     async process(job: Job<{ postId: string; files: any, targetId: Types.ObjectId }>) {
//         const { postId, files, targetId } = job.data;
//         console.log(files)
//         // console.log('ths is queue bro')
//         try {

//             let media = {
//                 images: [],
//                 videos: []
//             }

//             let postMedia = []
//             for (let file of files) {
//                 const fileType = file.fileType
//                 const filename = file.filename
//                 const buffer = Buffer.from(file.file, 'base64')
//                 let uploaded = await this.uploadService.processAndUploadContent(buffer, filename, fileType)
//                 console.log(uploaded)
//                 if (fileType == 'video') {
//                     media.videos.push(uploaded)
//                     postMedia.push({ type: 'video', url: uploaded })
//                 }
//                 if (fileType == 'image') {
//                     media.images.push(uploaded)
//                     postMedia.push({ type: 'image', url: uploaded })
//                 }
//             }


//             const postDetails = { media: postMedia, isUploaded: true }
//             console.log(postDetails, postId, targetId, 'meda upload consumer')
//             await this.postsService.updatePost(postId, postDetails);
//             await this.mediaService.storeMedia(targetId, media)
//         } catch (error) {
//             console.error(`Error uploading media for post ${postId}:`, error);
//             await this.postsService.deletePost(postId);
//         }
//     }
// }

@Controller('posts')
export class PostsController {
    private readonly stripe: Stripe
    constructor(
        private userService: UserService,
        private postService: PostsService,
        private uploadService: UploadService,
        private readonly mediaService: MediaService,
        private readonly eventEmiiter: EventEmitter2,
        private readonly chatGateway: ChatGateway,
        @InjectQueue("media-upload") private readonly mediaUploadQueue: Queue,

    ) {
        this.stripe = stripe
    }

    @Get()
    async getPosts(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user
        const { type, cursor, targetId } = req.query
        console.log(targetId, 'targetid')
        response.json(await this.postService.getPosts(cursor, sub, targetId, type))
    }

    @Get('feed')
    async feed(@Req() req: Request, @Res() response: Response) {
        const user = req.user
        const cursor = req.query.cursor
        response.json(await this.postService.feed(user.sub, cursor))
    }


    @UseInterceptors(FilesInterceptor('files'))
    @Post("create")
    async createPost(@Body(new ZodValidationPipe(CreatePost, true, "postData")) createPostDTO: CreatePostDTO, @Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[]) {

        const uploadPromise = files.map((file) => {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            return this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
        })

        const { sub } = req.user
        let targetId = createPostDTO.type == "user" ? new Types.ObjectId(sub) : new Types.ObjectId(createPostDTO.targetId)

        let uploadedPost = await this.postService.createPost(
            {
                ...createPostDTO,
                isUploaded: files.length > 0 ? false : null,
                targetId,
                user: sub
            })

        if (files.length > 0) {
            this.eventEmiiter.emit("files.uploaded", { uploadPromise, postId: uploadedPost._id.toString(), targetId, type: createPostDTO.type })
        }

        res.json(uploadedPost)
    }


    @UseInterceptors(FilesInterceptor('files'))
    @Post("update")
    async updatePost(@Body(new ZodValidationPipe(UpdatePost, true, "postData")) updatePostDto: UpdatePostDTO, @Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[]) {
        console.log("files :", files)
        const _postData = updatePostDto

        // const media = {
        //     images: [],
        //     videos: []
        // }

        // const removeMedia = {
        //     images: [],
        //     videos: []
        // }

        // const postMedia = []

        // if (_postData.media.length > 0) {
        //     const { media } = _postData
        //     for (let file in media) {
        //         if (media[file].remove) {
        //             let imageUrlSplit = media[file].url.split("/")
        //             console.log(`deleting ${imageUrlSplit} from s3...`)
        //             let filename = imageUrlSplit[imageUrlSplit.length - 1]
        //             await this.uploadService.deleteFromS3(filename)
        //         }
        //     }
        // }

        // _postData.media.forEach((_media) => {
        //     if (!_media?.remove && _media.type == 'video') {
        //         postMedia.push({ type: 'video', url: _media.url })
        //     }
        //     if (!_media?.remove && _media.type == 'image') {
        //         postMedia.push({ type: 'image', url: _media.url })
        //     }
        //     if (_media?.remove && _media.type == 'video') {
        //         removeMedia.videos.push(_media.url)
        //     }
        //     if (_media?.remove && _media.type == 'image') {
        //         removeMedia.images.push(_media.url)
        //     }
        // })

        // for (let file of files) {
        //     const fileType = getFileType(file.mimetype)
        //     const filename = uuidv4()
        //     console.log(file)
        //     let uploaded = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
        //     console.log(uploaded)
        //     if (fileType == 'video') {
        //         media.videos.push(uploaded.url)
        //         postMedia.push({ type: 'video', url: uploaded.url })
        //     }
        //     if (fileType == 'image') {
        //         media.images.push(uploaded.url)
        //         postMedia.push({ type: 'image', url: uploaded.url })
        //     }
        // }

        // const { sub } = req.user as { username: string, sub: string }

        // await this.mediaService.storeMedia(new Types.ObjectId(sub), media)
        // await this.mediaService.removeMedia(new Types.ObjectId(sub), removeMedia)

        // console.log(postMedia, media, removeMedia)
        // this.chatGateway.uploadSuccess({isSuccess: true})

        const post = await this.postService.getPost(_postData.postId)

        if (!post || post.isUploaded == false) {
            throw new BadRequestException("please wait previous post update is in process...")
        }

        let uploadedPost = await this.postService.updatePost(
            _postData.postId,
            {
                ...updatePostDto,
                isUploaded: files.length > 0 ? false : null,
            })

        if (files.length > 0) {

            const uploadPromise = files.map((file) => {
                const fileType = getFileType(file.mimetype)
                const filename = uuidv4()
                return this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
            })

            this.eventEmiiter.emit("files.uploaded", { uploadPromise, postId: post._id.toString(), targetId: post.targetId, type: post.type, uploadType: 'update', _postData })
        }

        res.json(uploadedPost)
    }

    @Post("delete")
    async deletePost(@Body(new ZodValidationPipe(DeletePost)) deletePostDTO: DeletePostDTO, @Req() req, @Res() res: Response) {
        const { postDetails } = deletePostDTO
        console.log(postDetails.media)

        const { sub } = req.user

        let media: { images: string[], videos: string[] } = {
            images: [],
            videos: []
        }

        if (postDetails.media && postDetails.media.length > 0) {
            const { media } = postDetails
            for (let image in media) {
                if (typeof media[image].url == 'string') {
                    let imageUrlSplit = media[image].url.split("/")
                    console.log(`deleting ${imageUrlSplit} from s3...`)
                    let filename = imageUrlSplit[imageUrlSplit.length - 1]
                    await this.uploadService.deleteFromS3(filename)
                }
            }
        }

        if (postDetails.media && postDetails.media.length > 0) {
            for (let file in postDetails.media) {
                if (postDetails.media[file].type == 'video') {
                    media.videos.push(postDetails.media[file].url)
                }
                if (postDetails.media[file].type == 'image') {
                    media.images.push(postDetails.media[file].url)
                }
            }

            await this.mediaService.removeMedia(new Types.ObjectId(sub), media)
        }

        this.chatGateway.uploadSuccess({ isSuccess: true })

        res.json(await this.postService.deletePost(postDetails.postId))
    }

    @Post("post")
    async getPost(@Body(new ZodValidationPipe(GetPost)) @Req() req: Request, @Res() res: Response) {
        const { postId } = req.body
        res.json(await this.postService.getPost(postId))
    }

    @Post("like")
    async like(@Body(new ZodValidationPipe(LikePost)) body: LikePostDTO, @Req() req: Request, @Res() res: Response) {
        const { postId, authorId, type, targetId } = body
        console.log('author', authorId, targetId)
        const { sub } = req.user as { sub: string, username: string }
        res.json(await this.postService.toggleLike(sub, postId, "post", authorId, type, targetId))
    }


    // @Post("likedBy")
    // async likedBy(@Req() req) {
    //     const { postId } = req.body
    //     return await this.postService.getLikedUsers({ postId })
    // }


    @Post("likeComment")
    async likeComment(@Body(new ZodValidationPipe(LikeCommentOrReply)) body: LikeCommentOrReplyDTO, @Req() req, @Res() res: Response) {
        const { targetId } = body
        res.json(await this.postService.toggleLike(req.user.sub, targetId, "comment"))
    }

    @Post("likeReply")
    async likeReply(@Body(new ZodValidationPipe(LikeCommentOrReply)) body: LikeCommentOrReplyDTO, @Req() req, @Res() res: Response) {
        const { targetId } = body
        res.json(await this.postService.toggleLike(req.user.sub, targetId, "reply"))
    }

    @Post("bookmark")
    async bookmarkPost(@Body(new ZodValidationPipe(BookmarkPost)) body: BookmarkPostDTO, @Req() req, @Res() res: Response) {
        const { postId, targetId, type } = body
        const { sub } = req.user
        res.json(await this.postService.toggleBookmark(sub, postId, targetId, type))
    }

    @Get("bookmarks")
    async getBookmarkedPosts(@Query(new ZodValidationPipe(Cursor)) cursorDTO: CursorDTO, @Req() req: Request, @Res() res: Response) {
        const { sub } = req.user
        const { cursor } = cursorDTO
        console.log(cursor, 'bookmarks')
        res.json(await this.postService.getBookmarks(cursor, sub))
    }


    @Post("report")
    async reportPost(@Body(new ZodValidationPipe(ReportPost)) reportPostDTO: ReportPostDTO, @Req() req, @Res() res: Response) {
        const { postId, reportData } = reportPostDTO
        const { userId, type, reportMessage } = reportData
        res.json(await this.postService.reportPost(postId, { userId, type, reportMessage }))
    }

    @Get("promotions")
    async getPromotions(@Query(new ZodValidationPipe(GetPromotions)) query: GetPromotionsDTO, @Req() req, @Res() res: Response) {
        const { cursor, reverse } = query
        console.log(reverse, 'get promotions')
        res.json(await this.postService.getPromotions(cursor, req.user.sub, reverse))
    }

    @Post("promotion")
    async promotePost(@Body(new ZodValidationPipe(PromotePost)) promotePostDTO: PromotePostDTO, @Req() req, @Res() res: Response) {
        const { postId, promotionDetails } = promotePostDTO
        const { reachTarget } = promotionDetails

        return { sessionId: await this.postService.postPromotion(postId, req.user.sub, { reachTarget }) }
    }

    @Get("promotedPosts")
    async getPromotedPosts(@Req() req: Request, @Res() res: Response) {
        const { sub } = req.user
        res.json(await this.postService.getPromotedPosts(sub, 'pakistan'))
    }

    @Post("view")
    async viewPost(@Body(new ZodValidationPipe(ViewPost)) viewPostDTO: ViewPostDTO, @Req() req, @Res() res: Response) {
        const { postId, type } = viewPostDTO
        const { sub } = req.user
        console.log('viewPost')
        res.json(await this.postService.viewPost(sub, postId, type))
    }

    // @Public()
    // @Post("testing/promoted")
    // async testingPromotedPosts(@Req() req, @Res() res: Response) {
    //     res.json(await this.postService.testingPromotedPosts({ country: "pakistan", city: "karachi", area: "pipri" }))
    // }

    @Public()
    @Post("promotion/webhook")
    async promotionWebhook(@Req() req, @Res() res: Response) {
        const event = req.body;

        console.log(event.type)
        const paymentIntent: any = event.data.object;
        const promotionId = paymentIntent.metadata
        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent: any = event.data.object;
                res.json(await this.handlePaymentIntentSucceeded(paymentIntent))
                break;
            case 'payment_intent.failed':
                res.json(await this.handlePaymentIntentFailed(paymentIntent))

            case 'payment_method.attached':
                const paymentMethod = event.data.object;
                break;
            // ... handle other event types
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a response to acknowledge receipt of the event
    }



    private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
        return await this.postService.promotionPaymentSuccess(paymentIntent.metadata.promotionId, paymentIntent.metadata.totalAmount, paymentIntent.id)
    }

    private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
        return await this.postService.promotionPaymentFailure(paymentIntent.metadata.promotionId)
    }

    @Post("promotion/activationToggle")
    async promotionActivationToggle(@Body(new ZodValidationPipe(PromotionActivation)) promotionActivationDTO: PromotionActivationDTO, @Req() req: Request, @Res() res: Response) {
        const { postId } = promotionActivationDTO
        console.log('promotion activationToggle')
        res.json(await this.postService.promotionActivationToggle(postId))
    }

}
