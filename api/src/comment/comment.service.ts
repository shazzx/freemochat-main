import { BadRequestException, Injectable, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { NotificationService } from 'src/notification/notification.service';
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
        private readonly notificationService: NotificationService,
    ) { }

    async getComments(postId, cursor, userId: string) {
        const limit = 36
        const query = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        const comments = await this.commentModel.aggregate([
            { $match: { ...query, post: postId, type: 'comment' } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: 'users',
                    let: { userId: '$user' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
                        { $project: { _id: 1, username: 1, profile: 1, firstname: 1, lastname: 1 } }
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
                $lookup: {
                    from: 'counters',
                    let: { commentId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$commentId'] },
                                        { $eq: ['$name', 'comment'] },
                                        { $eq: ['$type', 'replies'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'counters'
                }
            },

            {
                $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                firstname: 1,
                                lastname: 1,
                                profile: 1
                            }
                        }
                    ],
                    as: 'mentions'
                }
            },

            {
                $addFields: {
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    repliesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'replies'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                },
            },

            {
                $project: {
                    _id: 1,
                    content: 1,
                    post: 1,
                    user: 1,
                    mentions: 1,
                    reaction: 1,
                    repliesCount: { $ifNull: ['$repliesCount.count', 0] },
                    audio: 1,
                    likesCount: 1,
                    isLikedByUser: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ]).sort({ createdAt: -1 });

        const hasNextPage = comments.length > limit;
        const _comments = hasNextPage ? comments.slice(0, -1) : comments;
        const nextCursor = hasNextPage ? _comments[_comments.length - 1].createdAt.toISOString() : null;
        const results = { comments: _comments, nextCursor };

        return results
    }

    async getReplies(commentId, cursor, userId: string) {
        const limit = 36
        const query = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        const replies = await this.commentModel.aggregate([
            { $match: { ...query, parentId: new Types.ObjectId(commentId), type: 'reply', } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: 'users',
                    let: { userId: '$user' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
                        { $project: { _id: 1, username: 1, profile: 1, firstname: 1, lastname: 1 } }
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
                $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                firstname: 1,
                                lastname: 1,
                                profile: 1
                            }
                        }
                    ],
                    as: 'mentions'
                }
            },

            {
                $addFields: {
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                },
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    post: 1,
                    user: 1,
                    mentions: 1,
                    reaction: 1,
                    parentId: 1,
                    type: 1,
                    audio: 1,
                    likesCount: 1,
                    isLikedByUser: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ]).sort({ createdAt: -1 });

        const hasNextPage = replies.length > limit;
        const _replies = hasNextPage ? replies.slice(0, -1) : replies;
        const nextCursor = hasNextPage ? _replies[_replies.length - 1].createdAt.toISOString() : null;

        const results = { replies: _replies, nextCursor };
        return results
    }

    async commentOnPost({
        commentDetails,
        postId,
        mentions,
        hashtags,
        userId,
        targetId,
        targetType,
        postType,
        authorId,
        file }: {
            commentDetails: { content: string, duration: string, audio?: { src: string, duration: string } },
            postId: string,
            mentions: string[],
            hashtags: string[],
            userId: string,
            targetId: string,
            targetType: string,
            postType: string,
            authorId: string,
            file: Express.Multer.File
        }) {

        if (file) {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            try {

                let fileUrl = await this.uploadService.uploadToS3(file.buffer, filename, fileType)

                commentDetails = { ...commentDetails, audio: { src: fileUrl, duration: commentDetails.duration } }
            } catch (error) {
                console.log(error)
            }
        }



        console.log(postType, 'this is post type')
        const comment = await this.commentModel.create({
            ...commentDetails,
            mentions: mentions?.map(id => new Types.ObjectId(id)) || [],
            hashtags,
            post: postId,
            user: new Types.ObjectId(userId),
            type: 'comment'
        })
        await this.metricsAggregatorService.incrementCount(new Types.ObjectId(postId), (postType || 'post'), "comments")

        if (userId != authorId) {
            console.log('creating notificatoin for post owner')
            await this.notificationService.createNotification(
                {
                    from: new Types.ObjectId(userId),
                    user: new Types.ObjectId(authorId),
                    targetId: new Types.ObjectId(targetId),
                    type: 'comment',
                    targetType,
                    postType,
                    value: `has commented on your ${postType}`
                },
                true
            )
        }
        return comment
    }

    async removeComment(commentDetails, userId: string) {
        const deletedComment = await this.commentModel.findOneAndDelete({ _id: new Types.ObjectId(commentDetails.commentId), user: new Types.ObjectId(userId) })

        if (!deletedComment) {
            throw new BadRequestException('Comment not found or you do not have permission to delete it.');
        }
        await this.metricsAggregatorService.decrementCount(new Types.ObjectId(commentDetails.postId), "post", "comments")

        if (commentDetails?.audio) {
            await this.uploadService.deleteFromS3(commentDetails.audio.src)
        }

        return deletedComment
    }

    async replyOnComment({ replyDetails, mentions, hashtags, postId, commentId, userId, authorId, commentAuthorId, targetId, targetType, postType, file }:
        {
            replyDetails: { content: string, duration: string, audio?: { src: string, duration: string } },
            postId: string,
            mentions: string[],
            hashtags: string[],
            commentId: string,
            userId: string,
            targetId: string,
            targetType: string,
            postType: string,
            authorId: string,
            commentAuthorId: string,
            file: Express.Multer.File
        }
    ) {
        if (file) {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            try {

                let fileUrl = await this.uploadService.uploadToS3(file.buffer, filename, fileType)

                replyDetails = { ...replyDetails, content: null, audio: { src: fileUrl, duration: replyDetails.duration } }
            } catch (error) {
                console.log(error)
            }
        }

        const reply = await this.commentModel.create(
            {
                ...replyDetails,
                mentions: mentions?.map(id => new Types.ObjectId(id)) || [],
                hashtags,
                post: postId,
                user: new Types.ObjectId(userId),
                type: 'reply',
                parentId: new Types.ObjectId(commentId)
            })
        await this.metricsAggregatorService.incrementCount(new Types.ObjectId(commentId), "comment", "replies")


        if (userId != authorId) {
            console.log('creating notificatoin for post owner')

            await this.notificationService.createNotification(
                {
                    from: new Types.ObjectId(userId),
                    user: new Types.ObjectId(authorId),
                    targetId: new Types.ObjectId(targetId),
                    type: 'reply',
                    postType,
                    targetType,
                    value: `has replied on your ${postType}`
                }, true
            )
        } else {
            console.log('not creating notificatoin for post owner')
        }

        if (userId != commentAuthorId) {
            console.log('creating notificatoin for comment owner')

            await this.notificationService.createNotification(
                {
                    from: new Types.ObjectId(userId),
                    user: new Types.ObjectId(commentAuthorId),
                    targetId: new Types.ObjectId(targetId),
                    type: 'reply',
                    postType,
                    targetType,
                    value: `has replied on your comment`
                }
            )
        } else {
            console.log('not creating notificatoin for comment owner')
        }
        console.log('creating notificatoin for other replies')
        this.sendNotificationsToTargetRecepients({ commentId, commentAuthorId, postAuthorId: authorId, targetId, targetType, postType, userId })
        return reply
    }

    async sendNotificationsToTargetRecepients({ commentId, userId, postAuthorId, commentAuthorId, targetId, targetType, postType }: { commentId: string, userId: string, commentAuthorId: string, targetId: string, targetType: string, postType: string, postAuthorId: string }) {
        const replies = await this.commentModel.find({ type: 'reply', parentId: new Types.ObjectId(commentId) }).populate("user")

        console.log(replies, 'replies')
        replies.forEach(async (reply: any) => {
            if ((postAuthorId == reply.user._id.toString()) || (commentAuthorId == reply.user._id.toString())) {
                return
            }
            console.log(reply.user._id.toString(), 'reply user id')
            console.log(userId, 'user id')
            await this.notificationService.createNotification(
                {
                    from: new Types.ObjectId(userId),
                    user: new Types.ObjectId(reply.user._id.toString()),
                    targetId: new Types.ObjectId(targetId),
                    type: 'reply',
                    postType,
                    targetType,
                    value: `has replied on the comment you have also replied on`
                }
            )
        })

    }

    async updateComment(commentDetails: { content: string }, mentions: string[], commentId: string, userId: string) {
        const comment = await this.commentModel.findOneAndUpdate(
            {
                _id: new Types.ObjectId(commentId),
                user: new Types.ObjectId(userId)
            },
            {
                content: commentDetails.content,
                mentions: mentions?.map(id => new Types.ObjectId(id)) || [],
            },
            { new: true }
        ).populate('user', 'firstname lastname username profile');

        if (!comment) {
            throw new BadRequestException('Comment not found or you do not have permission to update it.');
        }

        return {
            success: true,
            message: 'Comment updated successfully',
            comment
        };
    }

    async updateReply(replyDetails: { content: string }, mentions: string[], replyId: string, userId: string) {
        const reply = await this.commentModel.findOneAndUpdate(
            {
                _id: new Types.ObjectId(replyId),
                user: new Types.ObjectId(userId)
            },
            {
                content: replyDetails.content,
                mentions: mentions?.map(id => new Types.ObjectId(id)) || [],
            },
            { new: true }
        ).populate('user', 'firstname lastname username profile');

        if (!reply) {
            throw new BadRequestException('Reply not found or you do not have permission to update it.');
        }

        return {
            success: true,
            message: 'Reply updated successfully',
            reply
        };
    }


    async removeReply(replyDetails, userId: string) {

        const deletedReply = await this.commentModel.findOneAndDelete({ _id: new Types.ObjectId(replyDetails.replyId), user: new Types.ObjectId(userId) })

        if (!deletedReply) {
            throw new BadRequestException('Reply not found or you do not have permission to delete it.');
        }

        if (replyDetails.audio) {
            await this.uploadService.deleteFromS3(replyDetails.audio.src)
        }

        await this.metricsAggregatorService.decrementCount(new Types.ObjectId(replyDetails.commentId), "comment", "replies")

        return deletedReply

    }
}
