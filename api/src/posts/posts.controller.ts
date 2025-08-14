import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Query, Req, Res, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Response } from 'express';
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
import { BookmarkPost, BookmarkPostDTO, BulkViewPost, BulkViewPostDTO, CreateEnvironmentalContribution, CreateEnvironmentalContributionDTO, CreatePost, CreatePostDTO, CreateSharedPost, CreateSharedPostDTO, DeleteElement, DeleteElementDTO, DeletePost, DeletePostDTO, DeleteProject, DeleteProjectDTO, EnvironmentalContributionType, GetBookmarkedPostsDTO, GetGlobalMapCounts, GetGlobalMapCountsDTO, GetGlobalMapData, GetGlobalMapDataDTO, GetPost, GetPostDTO, GetPostLikes, GetPostLikestDTO, GetPromotions, GetPromotionsDTO, LikeCommentOrReply, LikeCommentOrReplyDTO, LikePost, LikePostDTO, PromotePost, PromotePostDTO, PromotionActivation, PromotionActivationDTO, ReportPost, ReportPostDTO, SearchGlobalMapLocations, SearchGlobalMapLocationsDTO, ServerPostData, UpdateEnvironmentalContribution, UpdateEnvironmentalContributionDTO, UpdatePost, UpdatePostDTO, UpdateProject, UpdateProjectDTO, ViewPost, ViewPostDTO } from 'src/schema/validation/post';
import { Request } from 'types/global';
import { Cursor, ValidMongoId } from 'src/schema/validation/global';
import Stripe from 'stripe';
import { z } from 'zod';
import { HashtagService } from 'src/hashtag/hashtagservice';
import { NotificationService } from 'src/notification/notification.service';

@Controller('posts')
export class PostsController {
    constructor(
        private postService: PostsService,
        private uploadService: UploadService,
        private readonly mediaService: MediaService,
        private readonly eventEmitter: EventEmitter2,
        private readonly hashtagService: HashtagService,
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
        const { cursor, targetId, type } = req.query as { type: string, cursor: string, targetId: string }
        console.log(targetId, 'get reels targetId')
        response.json(await this.postService.getReels(cursor, sub, targetId, type))
    }

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

    // @UseInterceptors(FilesInterceptor('files'))
    // @Post("create")
    // async createPost(@Body(new ZodValidationPipe(CreatePost, true, "postData")) createPostDTO: CreatePostDTO, @Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[]) {
    //     const uploadPromise = files.map((file) => {
    //         const fileType = getFileType(file.mimetype)
    //         const filename = uuidv4()
    //         return this.uploadService.processAndUploadContent(file.buffer, filename, fileType, file.originalname)
    //     })

    //     const { sub } = req.user
    //     let targetId = createPostDTO.type == "user" ? new Types.ObjectId(sub) : new Types.ObjectId(createPostDTO.targetId)

    //     let uploadedPost = await this.postService.createPost(
    //         {
    //             ...createPostDTO,
    //             isUploaded: files.length > 0 ? false : null,
    //             targetId,
    //             postType: 'post',
    //             user: new Types.ObjectId(sub)
    //         })

    //     if (files.length > 0) {
    //         this.eventEmitter.emit("files.uploaded", { uploadPromise, postId: uploadedPost._id.toString(), targetId, type: createPostDTO.type })
    //     }

    //     res.json(uploadedPost)
    // }


    // In your existing PostController - just modify this method
    // @UseInterceptors(FilesInterceptor('files'))
    // @Post("create")
    // async createPost(@Body(new ZodValidationPipe(CreatePost, true, "postData")) createPostDTO: CreatePostDTO, @Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[]) {
    //     const { sub } = req.user;
    //     let targetId = createPostDTO.type == "user" ? new Types.ObjectId(sub) : new Types.ObjectId(createPostDTO.targetId);

    //     console.log(createPostDTO, 'create post data');

    //     // 🔧 ADD THIS: Handle location posts
    //     if (createPostDTO.postType && ['plantation', 'garbage_collection', 'dam'].includes(createPostDTO.postType)) {
    //         // Add plantation update cycle
    //         if (createPostDTO.postType === 'plantation' && createPostDTO.plantationData) {
    //             const nextUpdateDue = new Date();
    //             nextUpdateDue.setMonth(nextUpdateDue.getMonth() + 3);
    //             createPostDTO.plantationData = {
    //                 ...createPostDTO.plantationData,
    //                 lastUpdateDate: new Date(),
    //                 nextUpdateDue,
    //                 isActive: true
    //             };
    //             createPostDTO.updateHistory = [{
    //                 updateDate: new Date(),
    //                 imageCount: files.length,
    //                 notes: 'Initial plantation'
    //             }];
    //         }
    //     }

    //     // Your existing createPost logic continues unchanged
    //     let uploadedPost = await this.postService.createPost({
    //         ...createPostDTO,
    //         isUploaded: files.length > 0 ? false : null,
    //         targetId,
    //         postType: createPostDTO.postType || 'post', // 🔧 ADD THIS LINE
    //         user: new Types.ObjectId(sub)
    //     });

    //     if (files.length > 0) {
    //         // 🔧 MODIFY THIS: Add location data to upload promise
    //         const uploadPromise = files.map((file, index) => {
    //             const fileType = getFileType(file.mimetype);
    //             const filename = uuidv4();
    //             return this.uploadService.processAndUploadContent(file.buffer, filename, fileType, file.originalname)
    //                 .then(result => ({
    //                     ...result,
    //                     location: createPostDTO.mediaLocations?.[index] // 🔧 ADD THIS
    //                 }));
    //         });

    //         this.eventEmitter.emit("files.uploaded", {
    //             uploadPromise,
    //             postId: uploadedPost._id.toString(),
    //             targetId,
    //             type: createPostDTO.type
    //         });
    //     }

    //     res.json(uploadedPost);
    // }


    @Get("global-map/data")
    async getGlobalMapData(
        @Query(new ZodValidationPipe(GetGlobalMapData)) query: GetGlobalMapDataDTO,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { sub } = req.user;
        const result = await this.postService.getGlobalMapData(query, sub);
        res.json(result);
    }

    @Get("global-map/counts")
    async getGlobalMapCounts(
        @Query(new ZodValidationPipe(GetGlobalMapCounts)) query: GetGlobalMapCountsDTO,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const result = await this.postService.getGlobalMapCounts(query);
        res.json(result);
    }

    @Get("global-map/search")
    async searchGlobalMapLocations(
        @Query(new ZodValidationPipe(SearchGlobalMapLocations)) query: SearchGlobalMapLocationsDTO,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const result = await this.postService.searchGlobalMapLocations(query);
        res.json(result);
    }


    @UseInterceptors(FilesInterceptor('files'))
    @Post("create")
    async createPost(
        @Body(new ZodValidationPipe(CreatePost, true, "postData")) createPostDTO: CreatePostDTO,
        @Req() req: Request,
        @Res() res: Response,
        @UploadedFiles() files: Express.Multer.File[]
    ) {
        const { sub } = req.user;
        let targetId = createPostDTO.type == "user" ? new Types.ObjectId(sub) : new Types.ObjectId(createPostDTO.targetId);
        const hashtags = this.hashtagService.extractHashtags(createPostDTO.content || '');
        const mentions = createPostDTO?.mentions?.map(id => new Types.ObjectId(id)) || []

        // 🔧 UPDATED: Simplified post data - no environmental data
        let finalPostData = {
            ...createPostDTO,
            hashtags,
            mentions,
            isUploaded: files.length > 0 ? false : null,
            targetId,
            postType: createPostDTO.postType || 'post',
            user: new Types.ObjectId(sub)
        } as ServerPostData

        // Create the main post first
        let uploadedPost = await this.postService.createPost(finalPostData);
        this.hashtagService.processPostHashtags(uploadedPost._id, hashtags);

        // 🔧 NEW: Create EnvironmentalContribution document for environmental posts
        let environmentalContribution = null;
        if (createPostDTO.postType && ['plantation', 'garbage_collection', 'water_ponds', 'rain_water'].includes(createPostDTO.postType)) {

            let environmentalData: any = {
                postId: uploadedPost._id,
                location: createPostDTO.location, // Use main location from post
                updateHistory: [{
                    updateDate: new Date(),
                    media: [], // Will be populated after file upload
                    notes: this.getInitialNotes(createPostDTO.postType)
                }]
            };

            // Add type-specific environmental data based on postType
            if (createPostDTO.postType === 'plantation') {
                // Note: You'll need to add plantationData to CreatePostDTO or handle it separately
                const nextUpdateDue = new Date();
                nextUpdateDue.setMonth(nextUpdateDue.getMonth() + 6);

                environmentalData.plantationData = {
                    // Add default or passed plantation data
                    lastUpdateDate: new Date(),
                    nextUpdateDue,
                    isActive: true,
                    // You might want to add plantationData back to CreatePostDTO
                    // or handle this data separately in the request
                };
            }

            if (createPostDTO.postType === 'garbage_collection') {
                environmentalData.garbageCollectionData = {
                    // Add garbage collection specific data
                    // You might want to add this data to CreatePostDTO
                };
            }

            if (createPostDTO.postType === 'water_ponds') {
                environmentalData.waterPondsData = {
                    // Add water ponds specific data
                };
            }

            if (createPostDTO.postType === 'rain_water') {
                environmentalData.rainWaterData = {
                    // Add rain water specific data
                };
            }

            // Create the environmental contribution document
            // environmentalContribution = await this.environmentalContributionService.create(environmentalData);
        }

        // Handle file uploads
        if (files.length > 0) {
            const uploadPromise = files.map((file, index) => {
                const fileType = getFileType(file.mimetype);
                const filename = uuidv4();
                return this.uploadService.processAndUploadContent(file.buffer, filename, fileType, file.originalname)
                    .then(result => ({
                        ...result,
                        contributionId: environmentalContribution?._id
                    }));
            });

            this.eventEmitter.emit("files.uploaded", {
                uploadPromise,
                postId: uploadedPost._id.toString(),
                contributionId: environmentalContribution?._id?.toString(),
                targetId,
                type: createPostDTO.type,
                postType: createPostDTO.postType
            });
        }

        // Return post with environmental contribution data if applicable
        const response = {
            ...uploadedPost.toObject(),
            environmentalContribution: environmentalContribution?.toObject()
        };

        res.json(response);
    }

    private getInitialNotes(postType: string): string {
        const notesMap = {
            plantation: 'Initial plantation',
            water_ponds: 'Water pond established',
            rain_water: 'Rain water harvesting system installed',
            garbage_collection: 'Garbage collection point established'
        };
        return notesMap[postType] || 'Environmental contribution created';
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post('environmental-contributions/create')
    async createEnvironmentalContribution(
        @Body(new ZodValidationPipe(CreateEnvironmentalContribution, true, "elementData")) data: CreateEnvironmentalContributionDTO,
        @Req() req: Request,
        @Res() res: Response,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException("Image is required")
        }

        const post = await this.postService._getPost(data.postId)

        if (!post) {
            throw new BadRequestException("Project not found")
        }

        console.log(file, 'file')
        const fileType = getFileType(file.mimetype);
        const filename = uuidv4();
        const { url } = await this.uploadService.processAndUploadContent(
            file.buffer,
            filename,
            fileType,
            file.originalname,
            // false,
            // post.postType as EnvironmentalContributionType
        )
        console.log(url, 'url')
        console.log(data, 'data')

        if (post?.postType == 'plantation') {
            const nextUpdateDue = new Date();
            nextUpdateDue.setMonth(nextUpdateDue.getMonth() + 6);
            data = { ...data, plantationData: { ...data.plantationData, nextUpdateDue, lastUpdateDate: new Date() } }
        }

        const environmentalContribution = await this.postService.createElement(
            String(post.targetId),
            String(post.postType),
            { ...data, media: [{ url, name: filename, type: 'image', capturedAt: data.media[0].capturedAt }] }
        )
        console.log(environmentalContribution, 'saved data')
        res.json(environmentalContribution)

    }

    @UseInterceptors(FileInterceptor('file'))
    @Post('environmental-contributions/update')
    async updateEnvironmentalContribution(
        @Body(new ZodValidationPipe(UpdateEnvironmentalContribution, true, "elementData")) data: UpdateEnvironmentalContributionDTO,
        @Req() req: Request,
        @Res() res: Response,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException("Image is required")
        }

        const post = await this.postService._getPost(data.postId)

        if (!post) {
            throw new BadRequestException("Project not found")
        }

        if (!data.elementId) {
            throw new BadRequestException('Element id is required')
        }

        const element = await (await this.postService.elementExist(data.elementId)).toObject()

        if (!element) {
            throw new NotFoundException("Element not found")
        }

        console.log(String(element.postId), post._id.toString())
        if (String(element.postId) !== post._id.toString()) {
            throw new BadRequestException("Element is not part of the project")
        }

        console.log(file, 'file')
        const fileType = getFileType(file.mimetype);
        const filename = uuidv4();
        const { url } = await this.uploadService.processAndUploadContent(
            file.buffer,
            filename,
            fileType,
            file.originalname,
            false,
            post.postType as EnvironmentalContributionType
        )
        console.log(url, 'url')
        console.log(data, 'data')
        const elementUpdateHistory: any = [...element.updateHistory]

        const updateData = {
            ...data,
            updateHistory: [
                ...elementUpdateHistory,
                {
                    ...data.updateHistory[0],
                    media: [
                        {
                            name: filename,
                            url,
                            type: 'image',
                            capturedAt: data.updateHistory[0].media[0].capturedAt
                        }
                    ]
                }],
        }
        const environmentalContribution = await this.postService.updateElement(data.elementId, updateData)
        console.log(environmentalContribution, 'updated data')
        res.json(environmentalContribution)
    }

    @Get('environmental-contributions/:id')
    async getEnvironmentalContributionDetails(
        @Param('id') contributionId: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (!Types.ObjectId.isValid(contributionId)) {
            throw new BadRequestException('Invalid contribution Id format');
        }
        const contribution = await this.postService.getElementDetails(contributionId)
        res.json(contribution)
    }

    @Get('environmental-contributions/by-post/:postId')
    async getProjectEnvironmentalContributions(
        @Param('postId') postId: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (!Types.ObjectId.isValid(postId)) {
            throw new BadRequestException('Invalid Post Id format');
        }
        const contributions = await this.postService.getProjectElements(postId)
        res.json(contributions)
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post("reel")
    async editReel(
        @Body(new ZodValidationPipe(z.object({ postId: ValidMongoId, content: z.string() }), true, 'reelData'))
        reelData: { content: string, postId: string, mentions: string[] },
        @Req() req: Request,
        @Res() res: Response,
        @UploadedFile() file: Express.Multer.File
    ) {
        const { sub } = req.user
        const post = await this.postService._getPost(reelData.postId)
        if (!post) {
            throw new BadRequestException("No post found")
        }

        if (post.isUploaded == false) {
            throw new BadRequestException("please wait previous post update is in process...")
        }

        if (post.user.toString() !== sub) {
            throw new BadRequestException("You are not allowed to edit this post")
        }

        let hashtags;

        if (reelData.content) {
            hashtags = this.hashtagService.extractHashtags(reelData.content);
        }

        const mentions = reelData?.mentions?.map(id => new Types.ObjectId(id)) || []
        console.log('these are mentions')

        let updatedPost = await this.postService.updatePost(
            reelData.postId,
            {
                ...(hashtags && { hashtags }),
                mentions: [...post?.mentions, ...mentions],
                content: reelData.content,
            })

        console.log(file, 'this is file')

        if (file) {
            const fileType = getFileType(file.mimetype);
            const filename = uuidv4();
            const uploadPromise = [this.uploadService.processAndUploadContent(file.buffer, filename, fileType, file.originalname, true)];

            const { sub } = req.user
            let targetId = updatedPost.type == "user" ? new Types.ObjectId(sub) : new Types.ObjectId(String(updatedPost.targetId))

            this.eventEmitter.emit("reel.upload", {
                uploadPromise,
                postId: updatedPost._id.toString(),
                targetId,
                type: updatedPost.type,
                postType: 'post',
                fileBuffer: file.buffer,
                filename,
                _media: post?.media
            });

        }

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
            throw new BadRequestException("Post not found")
        }

        if (post.isUploaded == false) {
            throw new BadRequestException("please wait previous post update is in process...")
        }

        if (post.user.toString() !== sub) {
            throw new BadRequestException("You are not allowed to delete this post")
        }

        try {
            post.media.forEach(async (media) => {
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

            await this.postService.deletePost(deleteReelData.postId)
            this.hashtagService.removePostHashtags(post._id.toString(), post.hashtags)

            res.json({ deleted: true })
        } catch (error) {
            throw new BadRequestException("Error deleting reel post, please try again later.");
        }
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post("create/reel")
    async createReel(
        @Body(new ZodValidationPipe(CreatePost, true, "reelData")) reelData: CreatePostDTO,
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

        const { sub } = req.user
        let targetId = reelData.type == "user" ? new Types.ObjectId(sub) : new Types.ObjectId(reelData.targetId)
        const hashtags = this.hashtagService.extractHashtags(reelData.content);
        const mentions = reelData?.mentions?.map(id => new Types.ObjectId(id)) || []

        let uploadedPost = await this.postService.createPost({
            ...reelData,
            isUploaded: false,
            hashtags,
            mentions,
            postType: 'post',
            targetId,
            user: new Types.ObjectId(sub)
        });

        this.hashtagService.processPostHashtags(uploadedPost._id, hashtags);

        this.eventEmitter.emit("reel.upload", {
            uploadPromise,
            postId: uploadedPost._id.toString(),
            targetId,
            type: reelData.type,
            postType: 'post',
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
    async updatePost(
        @Body(new ZodValidationPipe(UpdatePost, true, "postData"))
        updatePostDto: UpdatePostDTO,
        @Req() req: Request,
        @Res() res: Response,
        @UploadedFiles()
        files: Express.Multer.File[]) {
        const _postData = updatePostDto

        console.log(updatePostDto)

        const post = await this.postService._getPost(_postData.postId)

        if (!post) {
            throw new BadRequestException("post not found")
        }

        if (post.isUploaded == false) {
            throw new BadRequestException("please wait previous post update is in process...")
        }
        let hashtags: string[];

        if (_postData.content) {
            hashtags = this.hashtagService.extractHashtags(_postData.content);
        }


        const mentions = _postData?.mentions?.map(id => new Types.ObjectId(id)) || []
        console.log('these are mentions')

        let uploadedPost = await this.postService.updatePost(
            _postData.postId,
            {
                ...updatePostDto,
                ...(hashtags && { hashtags }),
                mentions: [...post?.mentions, ...mentions],
                isUploaded: files.length > 0 ? false : null,
            })


        console.log("post uploaded")
        if (files.length > 0) {

            const uploadPromise = files.map((file) => {
                const fileType = getFileType(file.mimetype)
                const filename = uuidv4()
                return this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
            })

            this.eventEmitter.emit("files.uploaded", { uploadPromise, postId: post._id.toString(), targetId: post.targetId, type: post.type, uploadType: 'update', _postData })
        }

        res.json(uploadedPost)
    }

    @UseInterceptors(FilesInterceptor('files'))
    @Post("/project/update")
    async updateProject(@Body(new ZodValidationPipe(UpdateProject)) data: UpdateProjectDTO, @Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[]) {

        const post = await this.postService._getPost(data.postId)

        if (!post) {
            throw new BadRequestException("post not found")
        }

        if (post.isUploaded == false) {
            throw new BadRequestException("please wait previous post update is in process...")
        }

        let updatedPost = await this.postService.updateProject(data.postId, data)

        res.json(updatedPost)
    }

    @Post("/element/delete")
    async deleteElement(@Body(new ZodValidationPipe(DeleteElement)) { postId, elementId }: DeleteElementDTO, @Req() req, @Res() res: Response) {

        const post = await this.postService._getPost(postId)

        if (!post) {
            throw new BadRequestException('Project not found')
        }
        const elements = await this.postService.deleteElement(elementId, String(post?.postType), String(post?.targetId));

        if (!elements) {
            throw new BadRequestException("Element not found")
        }

        res.json({ deleted: true })
    }

    @Post("/project/delete")
    async deleteProject(@Body(new ZodValidationPipe(DeleteProject)) { postId }: DeleteProjectDTO, @Req() req, @Res() res: Response) {

        const post = await this.postService._getPost(postId)

        if (!post) {
            throw new BadRequestException('project not found')
        }

        await this.postService.deleteElements(String(post._id), String(post.postType), String(post.targetId));
        await this.postService.deletePost(post._id)
        this.hashtagService.removePostHashtags(post._id.toString(), post.hashtags)
        res.json({ deleted: true })
    }


    @Post("delete")
    async deletePost(@Body(new ZodValidationPipe(DeletePost)) deletePostDTO: DeletePostDTO, @Req() req, @Res() res: Response) {
        const { postDetails } = deletePostDTO

        const post = await this.postService._getPost(postDetails.postId)

        if (!post) {
            throw new BadRequestException('post not found')
        }

        const { sub } = req.user

        let media: { images: string[], videos: string[] } = {
            images: [],
            videos: []
        }

        if (post.media && post.media.length > 0) {
            const { media } = post
            for (let image in media) {
                if (typeof media[image].url == 'string') {
                    let imageUrlSplit = media[image].url.split("/")
                    let filename = imageUrlSplit[imageUrlSplit.length - 1]
                    await this.uploadService.deleteFromS3(filename)
                }
            }
        }

        if (post.media && post.media.length > 0) {
            for (let file in post.media) {
                if (post.media[file].type == 'video') {
                    media.videos.push(post.media[file].url)
                }
                if (post.media[file].type == 'image') {
                    media.images.push(post.media[file].url)
                }
            }

            await this.mediaService.removeMedia(new Types.ObjectId(sub), media)
        }
        await this.postService.deletePost(post._id)
        this.hashtagService.removePostHashtags(post._id.toString(), post.hashtags)
        res.json({ deleted: true })
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

        if (postType && postType !== 'post') {
            throw new BadRequestException("Invalid post type. Only 'post' allowed.");
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
        if (postType && postType !== 'post') {
            throw new BadRequestException("Invalid post type. Only 'post' and 'reel' are allowed.");
        }
        res.json(await this.postService.toggleLike({ userId: req.user.sub, targetId, type: "comment", postType: postType || 'post', reaction, targetType: 'user', authorId }))
    }

    @Post("likeReply")
    async likeReply(@Body(new ZodValidationPipe(LikeCommentOrReply)) body: LikeCommentOrReplyDTO, @Req() req, @Res() res: Response) {
        const { targetId, reaction, authorId, postType } = body
        if (postType && postType !== 'post') {
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
    async getBookmarkedPosts(@Query(new ZodValidationPipe(Cursor)) { cursor }: GetBookmarkedPostsDTO, @Req() req: Request, @Res() res: Response) {
        const { sub } = req.user
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
