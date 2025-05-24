import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, Req, Res, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { PostsService } from './posts.service';
import { response, Response } from 'express';
import { Types } from 'mongoose'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';
import { v4 as uuidv4 } from 'uuid'
import { getFileType } from 'src/utils/getFileType';
import { MediaService } from 'src/media/media.service';
import { Public } from 'src/auth/public.decorator';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { BookmarkPost, BookmarkPostDTO, BulkViewPost, BulkViewPostDTO, CreatePost, CreatePostDTO, CreateReel, CreateReelDTO, CreateSharedPost, CreateSharedPostDTO, DeletePost, DeletePostDTO, GetBookmarkedPosts, GetBookmarkedPostsDTO, GetPost, GetPostDTO, GetPostLikes, GetPostLikestDTO, GetPromotions, GetPromotionsDTO, LikeCommentOrReply, LikeCommentOrReplyDTO, LikePost, LikePostDTO, PromotePost, PromotePostDTO, PromotionActivation, PromotionActivationDTO, ReportPost, ReportPostDTO, UpdatePost, UpdatePostDTO, ViewPost, ViewPostDTO } from 'src/schema/validation/post';
import { Request } from 'types/global';
import { Cursor, CursorDTO, ValidMongoId } from 'src/schema/validation/global';
import Stripe from 'stripe';
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
    constructor(
        private userService: UserService,
        private postService: PostsService,
        private uploadService: UploadService,
        private readonly mediaService: MediaService,
        private readonly eventEmiiter: EventEmitter2,
        private readonly chatGateway: ChatGateway,
        @InjectQueue("media-upload") private readonly mediaUploadQueue: Queue,

    ) { }

    @Get()
    async getPosts(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user
        const { type, cursor, targetId, isSelf } = req.query as { type: string, cursor: string, targetId: string, isSelf: string }
        response.json(await this.postService.getPosts(cursor, sub, targetId, type, isSelf))
    }

    @Get('reels')
    async getReels(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user
        const { cursor, targetId } = req.query as { type: string, cursor: string, targetId: string }
        response.json(await this.postService.getReels(cursor, sub, targetId, 'user'))
    }

    // @Public()
    // @Get('/bulkupdate')
    // async bulkUpdatePost(){
    //     await this.postService.bulkUpdate()
    // }

    @Get('feed')
    async feed(@Req() req: Request, @Res() response: Response) {
        const user = req.user
        const cursor = req.query.cursor as string
        const reelsCursor = req.query.reelsCursor as string
        response.json(await this.postService.feed(user.sub, cursor, reelsCursor))
    }

    @Get('videosFeed')
    async videosFeed(@Req() req: Request, @Res() response: Response) {
        const user = req.user
        const cursor = req.query.cursor as string
        const postId = req.query.postId as string
        response.json(await this.postService.videosFeed(user.sub, cursor, postId))
    }

    @Get('reelsFeed')
    async reelsFeed(@Req() req: Request, @Res() response: Response) {
        const user = req.user
        const cursor = req.query.cursor as string
        const postId = req.query.postId as string
        response.json(await this.postService.reelsFeed(user.sub, cursor, postId))
    }

    @Post('watermarkReels')
    async watermarkReels(@Req() req: Request, @Res() response: Response) {
        const user = req.user
        const { reelUrl, postId } = req.body

        console.log(reelUrl, postId, 'reel details')
        const post = await this.postService._getPost(postId)

        if (!post) {
            throw new BadRequestException("No post found")
        }

        console.log(post)

        if (post.postType !== 'reel') {
            throw new BadRequestException("Provided post is not a reel")
        }

        if (post.media[0]['watermarkUrl']) {
            throw new BadRequestException("Your reel has already watermarked video")
        }

        const watermarkUrl = await this.uploadService.watermarkVideoFromSignedUrl(reelUrl)

        post.media[0]['watermarkUrl'] = watermarkUrl
        post.save()

        response.json({ watermarkUrl })
    }

    @Get("post")
    async getPost(@Query(new ZodValidationPipe(GetPost)) query: GetPostDTO, @Req() req: Request, @Res() response: Response) {
        const { sub } = req.user
        const { type, postId } = query
        response.json(await this.postService.getPost(sub, postId, type))
    }

    @UseInterceptors(FilesInterceptor('files'))
    @Post("create")
    async createPost(@Body(new ZodValidationPipe(CreatePost, true, "postData")) createPostDTO: CreatePostDTO, @Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[]) {
        const uploadPromise = files.map((file) => {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            return this.uploadService.processAndUploadContent(file.buffer, filename, fileType, file.originalname)
        })

        const { sub } = req.user
        let targetId = createPostDTO.type == "user" ? new Types.ObjectId(sub) : new Types.ObjectId(createPostDTO.targetId)

        let uploadedPost = await this.postService.createPost(
            {
                ...createPostDTO,
                isUploaded: files.length > 0 ? false : null,
                targetId,
                postType: 'post',
                user: new Types.ObjectId(sub)
            })

        if (files.length > 0) {
            this.eventEmiiter.emit("files.uploaded", { uploadPromise, postId: uploadedPost._id.toString(), targetId, type: createPostDTO.type })
        }

        res.json(uploadedPost)
    }


    @Post("reel")
    async editReel(
        @Body(new ZodValidationPipe(z.object({ postId: ValidMongoId, content: z.string() }))) reelData: { content: string, postId: string },
        @Req() req: Request,
        @Res() res: Response,
    ) {

        const { sub } = req.user
        const post = await this.postService._getPost(reelData.postId)
        if (!post) {
            throw new BadRequestException("No post found")
        }

        if (post.postType !== 'reel') {
            throw new BadRequestException("Provided post is not a reel")
        }

        if (post.isUploaded == false) {
            throw new BadRequestException("please wait previous post update is in process...")
        }

        console.log(post.user.toString(), sub, 'user id')

        if (post.user.toString() !== sub) {
            throw new BadRequestException("You are not allowed to edit this post")
        }

        let updatedPost = await this.postService.updatePost(
            reelData.postId,
            {
                content: reelData.content,
            })
        res.json({ updatedPost, success: true })
    }

    @Post("reel/remove")
    async deleteReel(
        @Body(new ZodValidationPipe(z.object({ postId: ValidMongoId }))) deleteReelData: { postId: string },
        @Req() req: Request,
        @Res() res: Response,
    ) {

        const { sub } = req.user
        const post = await this.postService._getPost(deleteReelData.postId)
        if (!post) {
            throw new BadRequestException("No post found")
        }

        if (post.postType !== 'reel') {
            throw new BadRequestException("Provided post is not a reel")
        }

        if (post.isUploaded == false) {
            throw new BadRequestException("please wait previous post update is in process...")
        }

        console.log(post.user.toString(), sub, 'user id')

        if (post.user.toString() !== sub) {
            throw new BadRequestException("You are not allowed to delete this post")
        }

        post.media.forEach(async (media) => {
            if (media.url) {
                let videoUrlSplit = media.url.split("/")
                let thumbnailUrlSplit = media.thumbnail.split("/")
                let watermarkUrlSplit = media.watermarkUrl.split("/")

                console.log(`deleting ${videoUrlSplit}, ${thumbnailUrlSplit}, ${watermarkUrlSplit} from s3...`)

                let videoFilename = videoUrlSplit[videoUrlSplit.length - 1]
                let thumbnailFilename = thumbnailUrlSplit[thumbnailUrlSplit.length - 1]
                let watermarkedVideoFilename = watermarkUrlSplit[watermarkUrlSplit.length - 1]

                console.log(videoFilename, thumbnailFilename, watermarkedVideoFilename, 'filenames')

                console.log(`deleting ${videoFilename} from s3...`)
                const video = await this.uploadService.deleteFromS3(videoFilename)

                console.log(`deleting ${thumbnailFilename} from s3...`)
                const thumbnail = await this.uploadService.deleteFromS3(thumbnailFilename)

                const watermarkVideo = await this.uploadService.deleteFromS3(watermarkedVideoFilename)
                console.log(`deleting ${watermarkedVideoFilename} from s3...`)
                console.log(video.$metadata.httpStatusCode, thumbnail.$metadata.httpStatusCode, watermarkVideo.$metadata.httpStatusCode, 'deleted')
            }
        })

        const deleted = await this.postService.deletePost(deleteReelData.postId)
        res.json({ deleted: true, success: true })
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post("create/reel")
    async createReel(
        @Body(new ZodValidationPipe(CreateReel, true, "reelData")) reelData: CreateReelDTO,
        @Req() req: Request,
        @Res() res: Response,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException("file is required");
        }

        const fileType = getFileType(file.mimetype);
        const filename = uuidv4();
        const uploadPromise = [this.uploadService.processAndUploadContent(file.buffer, filename, fileType, file.originalname, true)];

        const { sub } = req.user;
        let targetId = new Types.ObjectId(sub);

        let uploadedPost = await this.postService.createPost({
            ...reelData,
            isUploaded: false,
            postType: 'reel',
            targetId,
            user: new Types.ObjectId(sub)
        });

        this.eventEmiiter.emit("reel.upload", {
            uploadPromise,
            postId: uploadedPost._id.toString(),
            targetId,
            type: reelData.type,
            postType: 'reel',
            fileBuffer: file.buffer,
            filename
        });

        res.json(uploadedPost);
    }


    @Post("create/shared")
    async createSharedPost(@Body(new ZodValidationPipe(CreateSharedPost)) sharedPostData: CreateSharedPostDTO, @Req() req: Request, @Res() res: Response) {
        const { sub } = req.user
        let targetId = new Types.ObjectId(sub)

        let uploadedPost = await this.postService.createSharedPost(
            {
                ...sharedPostData,
                sharedPost: new Types.ObjectId(sharedPostData.sharedPostId),
                postType: 'post',
                targetId,
                user: new Types.ObjectId(sub),
                sharedPostType: sharedPostData.postType || 'post',
            })

        res.json(uploadedPost)
    }


    @UseInterceptors(FilesInterceptor('files'))
    @Post("update")
    async updatePost(@Body(new ZodValidationPipe(UpdatePost, true, "postData")) updatePostDto: UpdatePostDTO, @Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[]) {
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

        const post = await this.postService._getPost(_postData.postId)

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

        res.json(await this.postService.deletePost(postDetails.postId))
    }

    // @Post("post")
    // async getPost(@Body(new ZodValidationPipe(GetPost)) @Req() req: Request, @Res() res: Response) {
    //     const { postId } = req.body
    //     res.json(await this.postService.getPost(postId))
    // }

    @Post("like")
    async like(@Body(new ZodValidationPipe(LikePost)) body: LikePostDTO, @Req() req: Request, @Res() res: Response) {
        const { postId, authorId, type, postType, targetId, reaction } = body
        const { sub } = req.user as { sub: string, username: string }

        if (postType && postType !== 'post' && postType !== 'reel') {
            throw new BadRequestException("Invalid post type. Only 'post' and 'reel' are allowed.");
        }


        if (!postId || !Types.ObjectId.isValid(postId)) {
            throw new BadRequestException("Invalid post ID");
        }

        res.json(await this.postService.toggleLike({ userId: sub, targetId: postId, type: postType || "post", authorId, targetType: type, _targetId: targetId, reaction, postType: postType || 'post' }))
    }


    @Get("likes")
    async getPostLikes(@Query(new ZodValidationPipe(GetPostLikes)) query: GetPostLikestDTO, @Req() req: Request, @Res() res: Response) {
        const { postId, cursor } = query
        res.json(await this.postService.getPostLikes(cursor, postId))
    }


    // @Post("likedBy")
    // async likedBy(@Req() req) {
    //     const { postId } = req.body
    //     return await this.postService.getLikedUsers({ postId })
    // }


    @Post("likeComment")
    async likeComment(@Body(new ZodValidationPipe(LikeCommentOrReply)) body: LikeCommentOrReplyDTO, @Req() req, @Res() res: Response) {
        const { targetId, reaction, authorId, postType } = body
        if (postType && postType !== 'post' && postType !== 'reel') {
            throw new BadRequestException("Invalid post type. Only 'post' and 'reel' are allowed.");
        }
        res.json(await this.postService.toggleLike({ userId: req.user.sub, targetId, type: "comment", postType: postType || 'post', reaction, targetType: 'user', authorId }))
    }

    @Post("likeReply")
    async likeReply(@Body(new ZodValidationPipe(LikeCommentOrReply)) body: LikeCommentOrReplyDTO, @Req() req, @Res() res: Response) {
        const { targetId, reaction, authorId, postType } = body
        if (postType && postType !== 'post' && postType !== 'reel') {
            throw new BadRequestException("Invalid post type. Only 'post' and 'reel' are allowed.");
        }
        res.json(await this.postService.toggleLike({ userId: req.user.sub, targetId, type: "reply", reaction, targetType: 'user', authorId, postType: postType || 'post' }))
    }

    @Post("bookmark")
    async bookmarkPost(@Body(new ZodValidationPipe(BookmarkPost)) body: BookmarkPostDTO, @Req() req, @Res() res: Response) {
        const { postId, targetId, type, postType } = body
        const { sub } = req.user
        res.json(await this.postService.toggleBookmark(sub, postId, targetId, type, postType || 'post'))
    }

    @Get("bookmarks")
    async getBookmarkedPosts(@Query(new ZodValidationPipe(GetBookmarkedPosts)) { cursor, postType }: GetBookmarkedPostsDTO, @Req() req: Request, @Res() res: Response) {
        const { sub } = req.user
        res.json(await this.postService.getBookmarks(cursor, sub, postType || 'post'))
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
        res.json(await this.postService.getPromotions(cursor, req.user.sub, reverse))
    }

    @Post("promotion")
    async promotePost(@Body(new ZodValidationPipe(PromotePost)) promotePostDTO: PromotePostDTO, @Req() req, @Res() res: Response) {
        const { postId, promotionDetails, isApp } = promotePostDTO
        res.json(await this.postService.postPromotion({ postId, userId: req.user.sub, promotionDetails, isApp }))
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
        res.json(await this.postService.viewPost({ userId: sub, postId, type }))
    }


    @Post("view/bulk")
    async bulkViewPost(@Body(new ZodValidationPipe(BulkViewPost)) viewPostDTO: BulkViewPostDTO, @Req() req, @Res() res: Response) {
        const { viewedPosts, type } = viewPostDTO
        const { sub } = req.user
        res.json(await this.postService.bulkViewPosts({ userId: sub, postIds: viewedPosts, type }))
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
        res.json(await this.postService.promotionActivationToggle(postId))
    }

}
