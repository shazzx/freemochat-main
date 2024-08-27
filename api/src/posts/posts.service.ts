import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import { Model, PopulateOptions, Schema, startSession, Types } from 'mongoose';
import { CacheService } from 'src/cache/cache.service';
import { ChatGateway } from 'src/chat/chat.gateway';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { NotificationProducer } from 'src/notification/kafka/notification.producer';
import { NotificationService } from 'src/notification/notification.service';
import { Bookmark } from 'src/schema/bookmark';
import { Comment } from 'src/schema/comment';
import { Follower } from 'src/schema/followers';
import { Like } from 'src/schema/likes';
import { Member } from 'src/schema/members';
import { Post } from 'src/schema/post';
import { Promotion } from 'src/schema/promotion';
import { Report } from 'src/schema/report';
import { ViewedPosts } from 'src/schema/viewedPosts';
import { UserService } from 'src/user/user.service';
import { getTime } from 'src/utils/getTime';
import { stripeCheckout } from 'src/utils/stripe.session';
import { v4 as uuidv4 } from 'uuid'
import { string } from 'zod';


@Injectable()
export class PostsService {

    constructor(
        @InjectModel(Post.name) private readonly postModel: Model<Post>,
        @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
        @InjectModel(Report.name) private readonly reportModel: Model<Report>,
        @InjectModel(Promotion.name) private readonly promotionModel: Model<Promotion>,
        @InjectModel(Like.name) private readonly likeModel: Model<Like>,
        @InjectModel(Bookmark.name) private readonly bookmarkModel: Model<Bookmark>,
        @InjectModel(ViewedPosts.name) private readonly viewPostsModel: Model<ViewedPosts>,
        @InjectModel(Follower.name) private readonly followerModel: Model<Follower>,
        @InjectModel(Member.name) private readonly memberModel: Model<Member>,
        private readonly notificationService: NotificationService,
        private readonly metricsAggregatorService: MetricsAggregatorService,
        private readonly userService: UserService) { }

    async getPosts(cursor, userId, targetId, type) {
        let model = type + 's'
        const limit = 5
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        let query = targetId ? { ..._cursor, targetId: new Types.ObjectId(targetId), type } : { ..._cursor, type }
        console.log(
            "userId: ", userId,
            "cursor: ", cursor,
            "targetId: ", targetId,
            "query: ", query,
            "type: ", type)
        const posts = await this.postModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: model,
                    localField: "targetId",
                    foreignField: "_id",
                    as: "target"
                }
            },
            {
                $unwind: "$target"
            },
            {

                $lookup: {
                    from: 'likes',
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$postId'] },
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                        { $eq: ['$type', "post"] },
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
                    from: 'bookmarks',
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$postId', '$$postId'] },
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'userBookmark',
                },
            },

            // {
            //     $lookup: {
            //         from: 'counters',
            //         localField: "_id",
            //         foreignField: "targetId",
            //         as: 'likesCount'
            //     }
            // },
            {
                $lookup: {
                    from: 'counters',
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$postId'] },
                                        { $eq: ['$name', 'post'] },
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'counters'
                }
            },
            {
                $addFields: {
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                    likesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    commentsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    bookmarksCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            { count: 0 }
                        ]
                    }
                },
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    media: 1,
                    user: 1,
                    target: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    isBookmarkedByUser: 1,
                    updatedAt: 1,
                    createdAt: 1,
                },
            },
        ]);



        const hasNextPage = posts.length > limit;
        const _posts = hasNextPage ? posts.slice(0, -1) : posts;
        const nextCursor = hasNextPage ? _posts[_posts.length - 1].createdAt.toISOString() : null;

        const results = { posts: _posts, nextCursor };
        return results
        // let promotedPosts = await this.getPromotedPosts(userId, { country: string, city: string, area: string })
        // const results = { posts: [..._posts, ...promotedPosts], nextCursor };
        // this.cacheService.set(cacheKey, JSON.stringify(results), 300)

        return results
    }


    async getPost(userId: string, postId: string, type: string) {
        let model = type + 's'
        const limit = 5
        let query = { _id: new Types.ObjectId(postId) }
        const post = await this.postModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: model,
                    localField: "targetId",
                    foreignField: "_id",
                    as: "target"
                }
            },
            {
                $unwind: "$target"
            },
            {

                $lookup: {
                    from: 'likes',
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$postId'] },
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                        { $eq: ['$type', "post"] },
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
                    from: 'bookmarks',
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$postId', '$$postId'] },
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'userBookmark',
                },
            },
            {
                $lookup: {
                    from: 'counters',
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$postId'] },
                                        { $eq: ['$name', 'post'] },
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'counters'
                }
            },
            {
                $addFields: {
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                    likesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    commentsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    bookmarksCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            { count: 0 }
                        ]
                    }
                },
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    media: 1,
                    user: 1,
                    target: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    isBookmarkedByUser: 1,
                    updatedAt: 1,
                    createdAt: 1,
                },
            },
        ]);



        return post
    }


    async feed(userId, cursor) {
        console.log(userId, cursor)
        const limit = 5
        const query = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        // const posts = await this.postModel.aggregate([
        //     { $match: query },
        //     { $sort: { createdAt: -1 } },
        //     { $limit: limit + 1 },
        //     {
        //         $lookup: {
        //             from: 'users',
        //             localField: "targetId",
        //             foreignField: "_id",
        //             as: "target"
        //         }
        //     },
        //     {
        //         $unwind: "$target"
        //     },
        //     {

        //         $lookup: {
        //             from: 'likes',
        //             let: { postId: '$_id' },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ['$targetId', '$$postId'] },
        //                                 { $eq: ['$userId', new Types.ObjectId(userId)] },
        //                                 { $eq: ['$type', 'post'] },
        //                             ],
        //                         },
        //                     },
        //                 },
        //             ],
        //             as: 'userLike',
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: 'counters',
        //             let: { postId: '$_id' },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ['$targetId', '$$postId'] },
        //                                 { $eq: ['$name', 'post'] },
        //                                 { $in: ['$type', ['likes', 'comments', 'bookmarks']] }
        //                             ]
        //                         }
        //                     }
        //                 }
        //             ],
        //             as: 'counters'
        //         }
        //     },

        //     {

        //         $lookup: {
        //             from: 'bookmarks',
        //             let: { postId: '$_id' },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ['$postId', '$$postId'] },
        //                                 { $eq: ['$userId', new Types.ObjectId(userId)] },
        //                             ],
        //                         },
        //                     },
        //                 },
        //             ],
        //             as: 'userBookmark',
        //         },
        //     },
        //     {
        //         $addFields: {
        //             isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
        //             isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
        //             likesCount: {
        //                 $ifNull: [
        //                     { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
        //                     { count: 0 }
        //                 ]
        //             },
        //             commentsCount: {
        //                 $ifNull: [
        //                     { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
        //                     { count: 0 }
        //                 ]
        //             },
        //             bookmarksCount: {
        //                 $ifNull: [
        //                     { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
        //                     { count: 0 }
        //                 ]
        //             }
        //         },
        //     },
        //     {
        //         $project: {
        //             _id: 1,
        //             content: 1,
        //             media: 1,
        //             createdAt: 1,
        //             updatedAt: 1,
        //             likesCount: { $ifNull: ['$likesCount.count', 0] },
        //             commentsCount: { $ifNull: ['$commentsCount.count', 0] },
        //             bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
        //             user: 1,
        //             type: 1,
        //             target: 1,
        //             targetId: 1,
        //             isLikedByUser: 1,
        //             isBookmarkedByUser: 1,
        //         },
        //     },
        // ]);


        const posts = await this.postModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },

            {
                $lookup: {
                    from: 'users',
                    localField: 'targetId',
                    foreignField: '_id',
                    as: 'userTarget'
                }
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: 'targetId',
                    foreignField: '_id',
                    as: 'groupTarget'
                }
            },
            {
                $lookup: {
                    from: 'pages',
                    localField: 'targetId',
                    foreignField: '_id',
                    as: 'pageTarget'
                }
            },


            {

                $lookup: {
                    from: 'bookmarks',
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$postId', '$$postId'] },
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'userBookmark',
                },
            },
            {

                $lookup: {
                    from: 'likes',
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$postId'] },
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                        { $eq: ['$type', "post"] },
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
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$postId'] },
                                        { $eq: ['$name', 'post'] },
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'counters'
                }
            },
            {
                $addFields: {
                    target: {
                        $switch: {
                            branches: [
                                { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
                                { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
                                { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
                            ],
                            default: null
                        }
                    },
                    likesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
                            0
                        ]
                    },
                    commentsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
                            0
                        ]
                    },
                    bookmarksCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            0
                        ]
                    },
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                }
            },

            {
                $project: {
                    _id: 1,
                    content: 1,
                    media: 1,
                    user: 1,
                    target: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    isBookmarkedByUser: 1,
                    updatedAt: 1,
                    createdAt: 1,
                },
            },
        ]);

        const hasNextPage = posts.length > limit;
        const _posts = hasNextPage ? posts.slice(0, -1) : posts;
        const nextCursor = hasNextPage ? _posts[_posts.length - 1].createdAt.toISOString() : null;

        const results = { posts: _posts, nextCursor };
        // this.cacheService.set(cacheKey, JSON.stringify(results), 300)

        return results
    }

    async viewPost(userId, postId, type) {
        const viewedPost = await this.viewPostsModel.create({ type, userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) })
        const promotedPost = await this.promotionModel.findOneAndUpdate({ postId: new Types.ObjectId(postId), active: 1 }, { $inc: { reach: 1 } })
        return viewedPost
    }

    async testingPromotedPosts(address) {
        // await this.postModel.deleteMany()
        // await this.promotionModel.deleteMany()
        // const feedPosts = await this.postModel.aggregate([
        //     {
        //         $lookup: {
        //             from: 'promotions',
        //             localField: '_id',
        //             foreignField: 'postId',
        //             as: 'promotedInfo',
        //         },
        //     },
        //     {
        //         $match: {
        //             $and: [
        //                 { 'promotedInfo.0': { $exists: true } }, // Is a promoted post
        //                 {
        //                     $or: [
        //                         { 'promotedInfo.targetAddress.country': null }, // International posts
        //                         {
        //                             $and: [
        //                                 { 'promotedInfo.targetAddress.country': address.country },
        //                                 { 'promotedInfo.targetAddress.city': null },
        //                                 { 'promotedInfo.targetAddress.area': null },
        //                             ]
        //                         }, // Country-only targeting
        //                         {
        //                             $and: [
        //                                 { 'promotedInfo.targetAddress.country': address.country },
        //                                 { 'promotedInfo.targetAddress.city': address.city },
        //                                 { 'promotedInfo.targetAddress.area': null },
        //                             ]
        //                         }, // Country and city targeting
        //                         {
        //                             $and: [
        //                                 { 'promotedInfo.targetAddress.country': address.country },
        //                                 { 'promotedInfo.targetAddress.city': address.city },
        //                                 { 'promotedInfo.targetAddress.area': address.area },
        //                             ]
        //                         }, // Exact match on country, city, and area
        //                     ]
        //                 }
        //             ]
        //         },
        //     },
        //     {
        //         $addFields: {
        //             isPromoted: {
        //                 $cond: {
        //                     if: { $gt: [{ $size: '$promotedInfo' }, 0] },
        //                     then: true,
        //                     else: false,
        //                 },
        //             },
        //         },
        //     },
        //     {
        //         $project: {
        //             promotedInfo: 0, // Remove the promotedInfo field from the result
        //         },
        //     },
        // ]);
        // const promotedPosts = await this.promotionModel.aggregate([
        //     {
        //         $match: {
        //             $or: [
        //                 { 'targetAdress.country': null }, // International posts
        //                 {
        //                     $and: [
        //                         { 'targetAdress.country': address.country },
        //                         { 'targetAdress.city': null },
        //                         { 'targetAdress.area': null },
        //                     ]
        //                 }, // Country-only targeting
        //                 {
        //                     $and: [
        //                         { 'targetAdress.country': address.country },
        //                         { 'targetAdress.city': address.city },
        //                         { 'targetAdress.area': null },
        //                     ]
        //                 }, // Country and city targeting
        //                 {
        //                     $and: [
        //                         { 'targetAdress.country': address.country },
        //                         { 'targetAdress.city': address.city },
        //                         { 'targetAdress.area': address.area },
        //                     ]
        //                 }, // Exact match on country, city, and area
        //             ]
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: 'posts',
        //             localField: 'postId',
        //             foreignField: '_id',
        //             as: 'postDetails',
        //         },
        //     },
        //     {
        //         $unwind: '$postDetails',
        //     },
        //     {
        //         $lookup: {
        //             from: 'viewedposts',
        //             let: { postId: '$postId' },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ['$userId', new Types.ObjectId(userId)] },
        //                                 { $eq: ['$postId', '$$postId'] }
        //                             ]
        //                         }
        //                     }
        //                 }
        //             ],
        //             as: 'viewed'
        //         }
        //     },
        //     {
        //         $match: { viewed: { $size: 0 } }
        //     },
        //     {
        //         $project: {
        //             _id: '$postDetails._id',
        //             title: '$postDetails.title',
        //             content: '$postDetails.content',
        //             // Include other fields from the post as needed
        //             promotedId: '$_id',
        //             targetAddress: 1,
        //             // Include other fields from the promoted post as needed
        //         },
        //     },
        // ]);

        // return promotedPosts;
    }

    async getPromotedPosts(userId, address) {
        // const viewedPosts = await this.viewPostsModel.find({ userId, type: "promotion" }).distinct("postId")
        // const promotedPosts = await this.promotionModel.find({ postId: { $nin: viewedPosts }, reachTarget: { ...reachTarget } })
        // return promotedPosts

        // let sponsoredPost = await this.postModel.aggregate([
        //     {
        //         $lookup: {
        //             from: 'promotions',
        //             localField: '_id',
        //             foreignField: 'postId',
        //             as: 'promotion'
        //         }
        //     },
        //     // Unwind the promotion array (there should be only one match anyway)
        //     { $unwind: '$promotion' },
        //     // Match promotions for the user's country and where reach is less than target reach
        //     // Join with the viewed posts collection
        //     {
        //         $lookup: {
        //             from: 'viewedposts',
        //             let: { postId: '$_id' },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ['$userId', new Types.ObjectId(userId)] },
        //                                 { $eq: ['$postId', '$$postId'] }
        //                             ]
        //                         }
        //                     }
        //                 }
        //             ],
        //             as: 'viewed'
        //         }
        //     },
        //     // Only select posts that haven't been viewed (i.e., where 'viewed' array is empty)
        //     { $match: { viewed: { $size: 0 } } },
        //     { $sample: { size: 5 } }
        // ]).exec();
        const promotedPosts = await this.promotionModel.aggregate([
            {
                $match: {
                    $or: [
                        { 'targetAdress.country': null }, // International posts
                        {
                            $and: [
                                { 'targetAdress.country': address.country },
                                { 'targetAdress.city': null },
                                { 'targetAdress.area': null },
                            ]
                        }, // Country-only targeting
                        {
                            $and: [
                                { 'targetAdress.country': address.country },
                                { 'targetAdress.city': address.city },
                                { 'targetAdress.area': null },
                            ]
                        }, // Country and city targeting
                        {
                            $and: [
                                { 'targetAdress.country': address.country },
                                { 'targetAdress.city': address.city },
                                { 'targetAdress.area': address.area },
                            ]
                        }, // Exact match on country, city, and area
                    ]
                },
            },
            {
                $lookup: {
                    from: 'posts',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'postDetails',
                },
            },
            {
                $unwind: '$postDetails',
            },
            {
                $lookup: {
                    from: 'viewedposts',
                    let: { postId: '$postId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                        { $eq: ['$postId', '$$postId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'viewed'
                }
            },
            {
                $match: { viewed: { $size: 0 } }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'postDetails.targetId',
                    foreignField: '_id',
                    as: 'userTarget'
                }
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: 'postDetails.targetId',
                    foreignField: '_id',
                    as: 'groupTarget'
                }
            },
            {
                $lookup: {
                    from: 'pages',
                    localField: 'postDetails.targetId',
                    foreignField: '_id',
                    as: 'pageTarget'
                }
            },

            {

                $lookup: {
                    from: 'likes',
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$postId'] },
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                        { $eq: ['$type', 'post'] },
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
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$postId'] },
                                        { $eq: ['$name', 'post'] },
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks']] }
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
                    from: 'bookmarks',
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$postId', '$$postId'] },
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'userBookmark',
                },
            },
            {
                $addFields: {
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                    likesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    commentsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    bookmarksCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    target: {
                        $cond: {
                            if: { $gt: [{ $size: '$userTarget' }, 0] },
                            then: { $arrayElemAt: ['$userTarget', 0] },
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: '$groupTarget' }, 0] },
                                    then: { $arrayElemAt: ['$groupTarget', 0] },
                                    else: {
                                        $cond: {
                                            if: { $gt: [{ $size: '$pageTarget' }, 0] },
                                            then: { $arrayElemAt: ['$pageTarget', 0] },
                                            else: null
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: '$postDetails._id',
                    title: '$postDetails.title',
                    content: '$postDetails.content',
                    targetId: '$postDetails.targetId',
                    target: 1,
                    promotedId: '$_id',
                    targetAddress: 1,
                    media: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    user: 1,
                    isLikedByUser: 1,
                    isBookmarkedByUser: 1,
                    // Include other fields as needed
                },
            },
        ]);
        return promotedPosts
    }

    async promotionActivationToggle(postId) {
        const updatedPromotion = await this.promotionModel.findOneAndUpdate({ postId: new Types.ObjectId(postId) }, [
            {
                $set: {
                    active: {
                        $cond: {
                            if: { $eq: ["$active", 1] },
                            then: 0,
                            else: 1,
                        }
                    }
                }
            }
        ], { new: true })
        return updatedPromotion
    }

    async getPromotions(cursor, userId, reverse) {
        const limit = 6
        let _reverse: any = reverse == 'true' ? { createdAt: 1 } : { createdAt: -1 }
        console.log(_reverse, typeof reverse, reverse)
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        const query = { ..._cursor, user: userId }
        const promotions = await this.promotionModel.aggregate([
            { $match: query },
            { $sort: _reverse },
            { $limit: limit + 1 },
            // {
            // $group: {
            // _id: null,
            // totalCost: { $sum: "$paymentDetails.totalAmount" },
            // totalReach: { $sum: "$reach" },
            // activeCampaigns: { $sum: "$active" },
            // promotions: { $push: "$$ROOT" }
            // }
            // }
        ])
        const promotionsData = await this.promotionModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalCampaigns: { $sum: 1 },
                    activeCampaigns: { $sum: '$active' },
                    totalReach: { $sum: '$reach' },
                    totalCost: {
                        $sum: {
                            $toDouble: '$paymentDetails.totalAmount'
                        }
                    }
                }
            }
        ]);

        return { promotions, promotionsData: promotionsData[0] }
    }

    async postPromotion(postId, userId, promotionDetails) {

        const promotion = await this.promotionModel.findOne({ postId, user: userId })
        if (promotion && promotion.active == 1) {
            throw new BadRequestException()
        }

        const totalAmount = (promotionDetails.reachTarget / 1000) * 0.5

        const _promotion = await this.promotionModel.create({ user: userId, active: 1, postId: new Types.ObjectId(postId), reachTarget: promotionDetails.reachTarget, paymentDetails: { totalAmount, status: 'PENDING' }, targetAdress: { country: "pakistan", city: "karachi", area: "pipri" } })
        console.log(_promotion)

        let productDetails = [{ price_data: { unit_amount: promotionDetails.reachTarget * 0.05, currency: "usd", product_data: { name: "post promotion", description: "post promotion" } }, quantity: 1 }]

        const sessionId = await stripeCheckout(productDetails, userId, _promotion._id.toString(), totalAmount)
        return sessionId
    }



    async promotionPaymentSuccess(promotionId: string, totalAmount: string, paymentIntentId: string) {
        console.log(paymentIntentId, 'paymentintent id')
        const promotion = await this.promotionModel.findByIdAndUpdate(promotionId, { $set: { paymentDetails: { totalAmount, status: "PAID", paymentProvider: "Stripe", paymentIntentId } } })
        return promotion
    }


    async promotionPaymentFailure(promotionId: string) {
        const promotion = await this.promotionModel.findByIdAndDelete(promotionId)
        return promotion
    }

    async _getPost(postId) {
        const post = await this.postModel.findById(postId)
        // .populate([
        //     {
        //         path: "comments.user",
        //         model: 'User'
        //     }, { path: "user", model: "User" }])

        return post
    }



    async getLikedUsers({ postId }) {
        const post = (await this.postModel.findById(postId)).populate("likedBy")
        return post
    }

    async likePost({ username, postId }) {
        const post: any = await this.postModel.findById(postId).populate({
            path: "user",
            model: "User"
        })
        const user: any = await this.userService.getUser(username)
        // this.notificationGateway.handleNotifications({value:username + " has liked your post", userId: user[0]._id, username: user[0].username})
        if (user[0]._id !== post.user.toString()) {

            // await this.notificationProducer.sendNotification({ value: username + " has liked your post", from: user[0]._id.toString(), user: post.user.toString(), username: post.user.username })
        }

        let isLiked = false;
        if (post.likedBy?.length > 0) {
            isLiked = post.likedBy.includes(user[0]._id)
        }

        if (isLiked) {
            let userIndex = post.likedBy.findIndex((like) => {
                if (like == user[0]._id) {
                    return like
                }
            })
            post.likedBy.splice(userIndex, 1)
            post.save()
            return post
        }

        post.likedBy.push(user[0]._id)
        post.save()
        return post
    }


    async toggleBookmark(userId: string, postId: string, targetId: string, type: string): Promise<boolean> {
        const filter = {
            userId: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(targetId),
            postId: new Types.ObjectId(postId),
            type
        };
        const deleteFilter = {
            userId: new Types.ObjectId(userId),
            postId: new Types.ObjectId(postId),
        };

        const deleteResult = await this.bookmarkModel.deleteOne(deleteFilter);

        if (deleteResult.deletedCount === 0) {
            await this.bookmarkModel.create(filter);
            await this.metricsAggregatorService.incrementCount(filter.postId, "post", "bookmarks")
            return true;
        }
        await this.metricsAggregatorService.decrementCount(filter.postId, "post", "bookmarks")
        return false;
    }

    async getBookmarks(cursor, userId) {
        const limit = 5
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        let query = { ..._cursor, userId: new Types.ObjectId(userId) }

        console.log(
            "cursor: ", cursor,
            "targetId: ", userId,
            "query: ", query,
        )

        const bookmarks = await this.bookmarkModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: 'posts',
                    localField: "postId",
                    foreignField: "_id",
                    as: "post"
                }
            },
            {
                $unwind: "$post"
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'targetId',
                    foreignField: '_id',
                    as: 'userTarget'
                }
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: 'targetId',
                    foreignField: '_id',
                    as: 'groupTarget'
                }
            },
            {
                $lookup: {
                    from: 'pages',
                    localField: 'targetId',
                    foreignField: '_id',
                    as: 'pageTarget'
                }
            },


            {

                $lookup: {
                    from: 'likes',
                    let: { postId: '$postId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$postId'] },
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                        { $eq: ['$type', "post"] },
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
                    let: { postId: '$postId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$postId'] },
                                        { $eq: ['$name', 'post'] },
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'counters'
                }
            },
            {
                $addFields: {
                    target: {
                        $switch: {
                            branches: [
                                { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
                                { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
                                { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
                            ],
                            default: null
                        }
                    },
                    "likesCount": {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
                            0
                        ]
                    },
                    "commentsCount": {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
                            0
                        ]
                    },
                    "bookmarksCount": {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            0
                        ]
                    },
                    "post.isLikedByUser": { $gt: [{ $size: '$userLike' }, 0] },
                    "post.isBookmarkedByUser": true,

                }
            },
            {
                $addFields: {
                    "post.likesCount": { $ifNull: ['$likesCount.count', 0] },
                    "post.commentsCount": { $ifNull: ['$commentsCount.count', 0] },
                    "post.bookmarksCount": { $ifNull: ['$bookmarksCount.count', 0] },
                }
            },
            {
                $project: {
                    post: 1,
                    target: 1,
                    targetId: 1,
                    type: 1,
                    updatedAt: 1,
                    createdAt: 1,
                },
            },
        ]);



        const hasNextPage = bookmarks.length > limit;
        const _bookmarks = hasNextPage ? bookmarks.slice(0, -1) : bookmarks;
        const nextCursor = hasNextPage ? _bookmarks[_bookmarks.length - 1].createdAt.toISOString() : null;

        const results = { bookmarks: _bookmarks, nextCursor };
        return results

    }

    async toggleLike(userId: string, targetId: string, type: 'post' | 'comment' | 'reply', authorId?: string, targetType?: string, _targetId?: string): Promise<boolean> {
        // _targetId is account based (user | page | group)
        const filter = {
            userId: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(targetId),
            type,
        };

        console.log(_targetId)

        const interactionFilter = {
            userId: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(_targetId),
        }

        const deleteResult = await this.likeModel.deleteOne(filter);
        console.log(targetType, 'target type')

        if (deleteResult.deletedCount === 0) {
            await this.likeModel.create(filter);
            if (userId != authorId) {
                await this.notificationService.createNotification(
                    {
                        from: new Types.ObjectId(userId),
                        user: new Types.ObjectId(authorId),
                        targetId: new Types.ObjectId(targetId),
                        type,
                        targetType,
                        value: type == "post" ? "liked your post" : type == "comment" ? "liked your commnet" : "liked your reply"
                    }
                )
            }

            await this.metricsAggregatorService.incrementCount(filter.targetId, type, "likes")

            if (targetType == 'user' || targetType == "page") {
                console.log(filter)
                let updatedInteraction = await this.followerModel.updateOne({ follower: interactionFilter.userId, targetId: interactionFilter.targetId },
                    { $inc: { interactionScore: 1 } }
                )
                console.log(updatedInteraction)
            }
            if (targetType == 'group') {
                let updatedInteraction = await this.memberModel.updateOne({ member: interactionFilter.userId, groupId: interactionFilter.targetId },
                    { $inc: { interactionScore: 1 } }
                )
                console.log(updatedInteraction)

            }
            return true;
        }


        if (targetType == 'user' || targetType == "page") {
            let updatedInteraction = await this.followerModel.updateOne({ follower: interactionFilter.userId, targetId: interactionFilter.targetId },
                { $inc: { interactionScore: -1 } }
            )
            console.log(updatedInteraction)
        }

        if (targetType == 'group') {
            let updatedInteraction = await this.memberModel.updateOne({ member: interactionFilter.userId, groupId: interactionFilter.targetId },
                { $inc: { interactionScore: -1 } }
            )
            console.log(updatedInteraction)
        }

        await this.metricsAggregatorService.decrementCount(filter.targetId, type, "likes")
        return false; // Indicates the item is now unliked
    }

    async getBookmarkedPosts(username) {
        const user: any = await this.userService.getUser(username, "bookmarkedPosts")
        return user[0].bookmarkedPosts
    }

    async reportPost(postId: string, { userId, type, reportMessage }) {
        const report = await this.reportModel.create({ reportedBy: new Types.ObjectId(userId), type, postId: new Types.ObjectId(postId), reportMessage })
        return report
    }

    async createPost(postData: any) {
        const post = await this.postModel.create({ ...postData })

        return await post.populate({
            path: "user",
            model: "User"
        })
    }


    async updatePost(postId: string, postDetails: any) {
        const updatedPost = await this.postModel.findByIdAndUpdate(postId, { $set: { ...postDetails } }, { new: true })
        return updatedPost
    }


    async deletePost(postId: any) {
        const post = await this.postModel.findByIdAndDelete(postId)
        return post
    }
}
