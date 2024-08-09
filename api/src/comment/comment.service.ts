import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { Comment } from 'src/schema/comment';
import { UploadService } from 'src/upload/upload.service';
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class CommentService {
    constructor(
        @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
        private readonly uploadService: UploadService,
        private readonly metricsAggregatorService: MetricsAggregatorService,

    ) { }

    async getComments(postId, cursor, userId: string) {
        const limit = 5
        const cacheKey = `post:${postId}:comments:${cursor || 'start'}:${limit}`
        // const cachedPage = await this.cacheService.get(cacheKey)
        // console.log(cachedPage)
        // if (cachedPage) {
        //     const parsedPage = JSON.parse(cachedPage)
        //     return parsedPage
        // }

        // const comments = await this.commentModel
        //     .find(query)
        //     .sort({ createdAt: -1 })
        //     .limit(limit + 1)
        //     .populate({
        //         path: "user",
        //         model: "User"
        //     }).select("username images firstname lastname")
        //     .exec();


        const query = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        const comments = await this.commentModel.aggregate([
            { $match: { ...query, post: postId, type: 'comment' } },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: 'users',
                    let: { userId: '$user' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
                        { $project: { _id: 1, username: 1, images: 1, firstname: 1, lastname: 1 } } // Only fetch necessary user fields
                    ],
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {

                $lookup: {
                    from: 'likes',
                    let: { commentId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$commentId'] },
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                        { $eq: ['$type', 'comment'] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'userLike',
                },
            },
            {
                $addFields: {
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                },
            },
            // { $sort: { createdAt: -1 } },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    user: 1,
                    audio: 1,
                    likesCount: 1,
                    isLikedByUser: 1,
                    createdAt: 1,
                },
            },
        ]);

        const hasNextPage = comments.length > limit;
        const _comments = hasNextPage ? comments.slice(0, -1) : comments;
        const nextCursor = hasNextPage ? _comments[_comments.length - 1].createdAt.toISOString() : null;

        const results = { comments: _comments, nextCursor };
        console.log(results)
        // this.cacheService.set(cacheKey, JSON.stringify(results), 300)

        return results
    }

    async getReplies(commentId, cursor, userId: string) {
        const limit = 5
        // const cacheKey = `post:${postId}:comments:${cursor || 'start'}:${limit}`
        // const cachedPage = await this.cacheService.get(cacheKey)
        // console.log(cachedPage)
        // if (cachedPage) {
        //     const parsedPage = JSON.parse(cachedPage)
        //     return parsedPage
        // }

        // const comments = await this.commentModel
        //     .find(query)
        //     .sort({ createdAt: -1 })
        //     .limit(limit + 1)
        //     .populate({
        //         path: "user",
        //         model: "User"
        //     }).select("username images firstname lastname")
        //     .exec();


        const query = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        const replies = await this.commentModel.aggregate([
            { $match: { ...query, parentId: new Types.ObjectId(commentId), type: 'reply', } },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: 'users',
                    let: { userId: '$user' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
                        { $project: { _id: 1, username: 1, images: 1, firstname: 1, lastname: 1 } }
                    ],
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {

                $lookup: {
                    from: 'likes',
                    let: { replyId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$replyId'] },
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                        { $eq: ['$type', 'reply'] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'userLike',
                },
            },
            {
                $addFields: {
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                },
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    user: 1,
                    parentId: 1,
                    type: 1,
                    audio: 1,
                    likesCount: 1,
                    isLikedByUser: 1,
                    createdAt: 1,
                },
            },
        ]);

        const hasNextPage = replies.length > limit;
        const _replies = hasNextPage ? replies.slice(0, -1) : replies;
        const nextCursor = hasNextPage ? _replies[_replies.length - 1].createdAt.toISOString() : null;

        const results = { replies: _replies, nextCursor };
        console.log(results)
        // this.cacheService.set(cacheKey, JSON.stringify(results), 300)

        return results
    }

    async commentOnPost(commentDetails, postId: string, userId: string, file) {

        if (file) {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            console.log(fileType)
            try {

                let fileUrl = await this.uploadService.uploadToS3(file.buffer, filename, fileType)

                commentDetails = { ...commentDetails, audio: { src: fileUrl, duration: commentDetails.duration } }
                console.log(fileUrl)
            } catch (error) {
                console.log(error)
            }
        }


        const comment = await this.commentModel.create({ ...commentDetails, post: postId, user: new Types.ObjectId(userId), type: 'comment' })
        await this.metricsAggregatorService.incrementCount(new Types.ObjectId(postId), "post", "comments")
        return comment
    }

    async updateComment(commentDetails, commentId: string) {
        const comment = await this.commentModel.findByIdAndUpdate(commentId, { content: commentDetails.content })
        return comment
    }

    async removeComment(commentDetails) {
        if (commentDetails?.audio) {
            let deleted = await this.uploadService.deleteFromS3(commentDetails.audio.src)
            console.log(deleted, 'deleted')
        }

        const comment = await this.commentModel.findByIdAndDelete(commentDetails.commentId)
        console.log(commentDetails)
        await this.metricsAggregatorService.decrementCount(new Types.ObjectId(commentDetails.postId), "post", "comments")
        return comment
    }

    async replyOnComment(replyDetails, postId: string, commentId: string, userId: string, file) {
        console.log(replyDetails, postId, commentId, userId)
        if (file) {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            console.log(fileType)
            try {

                let fileUrl = await this.uploadService.uploadToS3(file.buffer, filename, fileType)

                replyDetails = { ...replyDetails, content: null, audio: { src: fileUrl, duration: replyDetails.duration } }
                console.log(fileUrl)
            } catch (error) {
                console.log(error)
            }
        }

        const reply = await this.commentModel.create(
            {
                ...replyDetails,
                post: postId,
                user: new Types.ObjectId(userId),
                type: 'reply',
                parentId: new Types.ObjectId(commentId)
            })
        return reply
    }


    async updateReply(replyDetails, replyId: string) {
        const comment = await this.commentModel.findByIdAndUpdate(replyId, { content: replyDetails.content })
        return comment
    }



    async removeReply(replyDetails) {
        if (replyDetails.audio) {
            let deleted = await this.uploadService.deleteFromS3(replyDetails.audio.src)
            console.log(deleted, 'deleted')
        }
        console.log(replyDetails)
        const reply = await this.commentModel.findByIdAndDelete(replyDetails.replyId)
        return reply
    }




}
