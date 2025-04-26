import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { LocationService } from 'src/location/location.service';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { NotificationService } from 'src/notification/notification.service';
import { PaymentService } from 'src/payment/payment.service';
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
import { CURRENCIES, PAYMENT_PROVIDERS, PAYMENT_STATES, POST_PROMOTION, ReachStatus } from 'src/utils/enums/global.c';
import { SBulkViewPost, SPostPromotion, SViewPost } from 'src/utils/types/service/posts';


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
        private readonly userService: UserService,
        private readonly locationService: LocationService,
        private readonly paymentService: PaymentService,
    ) { }

    async getPosts(cursor: string | null, userId: string, targetId: string, type: string, self: string) {
        let model = type + 's'
        const limit = 24

        // let visibility = self == 'true' ? {} : {}
        let visibility = {
            $or: [
                { visibility: 'public' },
                { $and: [{ visibility: 'private' }, { user: new Types.ObjectId(userId) }] }
            ]
        }

        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) }, ...visibility } : { ...visibility };
        let query = targetId ? { ..._cursor, targetId: new Types.ObjectId(targetId), type } : { ..._cursor, type }

        // const posts = await this.postModel.aggregate([
        //     { $match: query },
        //     { $sort: { createdAt: -1 } },
        //     { $limit: limit + 1 },
        //     {
        //         $lookup: {
        //             from: model,
        //             localField: "targetId",
        //             foreignField: "_id",
        //             as: "target"
        //         }
        //     },
        //     // {
        //     //     $lookup: {
        //     //         from: 'users',
        //     //         localField: "user",
        //     //         foreignField: "_id",
        //     //         as: "user"
        //     //     }
        //     // },
        //     // {
        //     //     $unwind: "$user"
        //     // },
        //     {
        //         $addFields: {
        //             userObjectId: {
        //                 $cond: {
        //                     if: { $eq: ["$type", "group"] },
        //                     then: {
        //                         $cond: {
        //                             if: { $eq: [{ $type: "$user" }, "string"] },
        //                             then: { $toObjectId: "$user" },
        //                             else: "$user"
        //                         }
        //                     },
        //                     else: null
        //                 }
        //             }
        //         }
        //     },

        //     {
        //         $lookup: {
        //             from: "users",
        //             let: { userId: "$userObjectId", postType: "$type" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ["$$postType", "group"] },
        //                                 { $eq: ["$_id", "$$userId"] }
        //                             ]
        //                         }
        //                     }
        //                 },
        //                 { $limit: 1 }
        //             ],
        //             as: "userDetails"
        //         }
        //     },
        //     {
        //         $addFields: {
        //             user: {
        //                 $cond: {
        //                     if: { $eq: ["$type", "group"] },
        //                     then: {
        //                         $cond: {
        //                             if: { $gt: [{ $size: "$userDetails" }, 0] },
        //                             then: { $arrayElemAt: ["$userDetails", 0] },
        //                             else: null
        //                         }
        //                     },
        //                     else: "$user"
        //                 }
        //             }
        //         }
        //     },
        //     {
        //         $unwind: "$target"
        //     },

        //     {
        //         $lookup: {
        //             from: 'posts',
        //             let: { sharedPostId: '$sharedPost' },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $ne: ['$$sharedPostId', null] },
        //                                 { $eq: ['$_id', '$$sharedPostId'] }
        //                             ]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $lookup: {
        //                         from: 'users',
        //                         localField: 'user',
        //                         foreignField: '_id',
        //                         as: 'userDetails'
        //                     }
        //                 },
        //                 {
        //                     $addFields: {
        //                         user: {
        //                             $cond: {
        //                                 if: { $gt: [{ $size: '$userDetails' }, 0] },
        //                                 then: { $arrayElemAt: ['$userDetails', 0] },
        //                                 else: '$user'
        //                             }
        //                         }
        //                     }
        //                 },
        //                 // Add other lookups that you need for the shared post
        //             ],
        //             as: 'sharedPostDetails'
        //         }
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
        //                                 { $eq: ['$type', "post"] },
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

        //     // {
        //     //     $lookup: {
        //     //         from: 'counters',
        //     //         localField: "_id",
        //     //         foreignField: "targetId",
        //     //         as: 'likesCount'
        //     //     }
        //     // },
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
        //         $addFields: {
        //             reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
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
        //             user: 1,
        //             target: 1,
        //             reaction: 1,
        //             likesCount: { $ifNull: ['$likesCount.count', 0] },
        //             commentsCount: { $ifNull: ['$commentsCount.count', 0] },
        //             bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
        //             isLikedByUser: 1,
        //             targetId: 1,
        //             type: 1,
        //             isBookmarkedByUser: 1,
        //             updatedAt: 1,
        //             createdAt: 1,
        //             sharedPost: {
        //                 $cond: {
        //                     if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
        //                     then: { $arrayElemAt: ['$sharedPostDetails', 0] },
        //                     else: null
        //                 }
        //             }
        //         },
        //     },
        // ]);

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
                $addFields: {
                    userObjectId: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $eq: [{ $type: "$user" }, "string"] },
                                    then: { $toObjectId: "$user" },
                                    else: "$user"
                                }
                            },
                            else: null
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userObjectId", postType: "$type" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$postType", "group"] },
                                        { $eq: ["$_id", "$$userId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "userDetails"
                }
            },
            {
                $addFields: {
                    user: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $gt: [{ $size: "$userDetails" }, 0] },
                                    then: { $arrayElemAt: ["$userDetails", 0] },
                                    else: null
                                }
                            },
                            else: "$user"
                        }
                    }
                }
            },
            {
                $unwind: "$target"
            },
            {
                $lookup: {
                    from: 'posts',
                    let: { sharedPostId: '$sharedPost' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ['$$sharedPostId', null] },
                                        { $eq: ['$_id', '$$sharedPostId'] }
                                    ]
                                }
                            }
                        },
                        // Target lookup for shared post
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
                        // Handle user for shared post
                        {
                            $addFields: {
                                userObjectId: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $eq: [{ $type: "$user" }, "string"] },
                                                then: { $toObjectId: "$user" },
                                                else: "$user"
                                            }
                                        },
                                        else: null
                                    }
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                let: { userId: "$userObjectId", postType: "$type" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$$postType", "group"] },
                                                    { $eq: ["$_id", "$$userId"] }
                                                ]
                                            }
                                        }
                                    },
                                    { $limit: 1 }
                                ],
                                as: "userDetails"
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'regularUserDetails'
                            }
                        },
                        {
                            $addFields: {
                                user: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$userDetails" }, 0] },
                                                then: { $arrayElemAt: ["$userDetails", 0] },
                                                else: null
                                            }
                                        },
                                        else: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                                then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                                else: "$user"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        // Handle likes for shared post
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
                        // Handle bookmarks for shared post
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
                        // Handle counters for shared post
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
                        // Combine fields for shared post
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
                                reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                                isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                            }
                        },
                        // Project shared post fields
                        {
                            $project: {
                                _id: 1,
                                content: 1,
                                media: 1,
                                user: 1,
                                promotion: 1,
                                isUploaded: 1,
                                target: 1,
                                reaction: 1,
                                likesCount: { $ifNull: ['$likesCount.count', 0] },
                                commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                                bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                                isLikedByUser: 1,
                                targetId: 1,
                                type: 1,
                                isBookmarkedByUser: 1,
                                updatedAt: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    as: 'sharedPostDetails'
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
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
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
                    reaction: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    isBookmarkedByUser: 1,
                    updatedAt: 1,
                    createdAt: 1,
                    sharedPost: {
                        $cond: {
                            if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
                            then: { $arrayElemAt: ['$sharedPostDetails', 0] },
                            else: null
                        }
                    }
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
    }

    async getPostLikes(cursor, postId) {
        const limit = 12
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        let query = { ..._cursor, targetId: new Types.ObjectId(postId) }

        const likedBy = await this.likeModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userArray'
                }
            },
            {
                $addFields: {
                    user: {
                        $arrayElemAt: ['$userArray', 0]
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    type: 1,
                    reaction: 1,
                    targetId: 1,
                    user: {
                        username: '$user.username',
                        firstname: '$user.firstname',
                        lastname: '$user.lastname',
                        profile: '$user.profile',
                    },
                }
            }
        ])


        const hasNextPage = likedBy.length > limit;
        const _likedBy = hasNextPage ? likedBy.slice(0, -1) : likedBy;
        const nextCursor = hasNextPage ? _likedBy[_likedBy.length - 1].createdAt.toISOString() : null;

        const results = { likedBy: _likedBy, nextCursor };
        return results
    }


    async getPost(userId: string, postId: string, type: string) {
        let model = type + 's'
        const limit = 5
        let query = { _id: new Types.ObjectId(postId) }
        // const post = await this.postModel.aggregate([
        //     { $match: query },
        //     { $sort: { createdAt: -1 } },
        //     { $limit: limit + 1 },
        //     {
        //         $lookup: {
        //             from: model,
        //             localField: "targetId",
        //             foreignField: "_id",
        //             as: "target"
        //         }
        //     },
        //     {
        //         $unwind: "$target"
        //     },
        //     {
        //         $addFields: {
        //             userObjectId: {
        //                 $cond: {
        //                     if: { $eq: ["$type", "group"] },
        //                     then: {
        //                         $cond: {
        //                             if: { $eq: [{ $type: "$user" }, "string"] },
        //                             then: { $toObjectId: "$user" },
        //                             else: "$user"
        //                         }
        //                     },
        //                     else: null
        //                 }
        //             }
        //         }
        //     },

        //     {
        //         $lookup: {
        //             from: "users",
        //             let: { userId: "$userObjectId", postType: "$type" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ["$$postType", "group"] },
        //                                 { $eq: ["$_id", "$$userId"] }
        //                             ]
        //                         }
        //                     }
        //                 },
        //                 { $limit: 1 }
        //             ],
        //             as: "userDetails"
        //         }
        //     },
        //     {
        //         $addFields: {
        //             user: {
        //                 $cond: {
        //                     if: { $eq: ["$type", "group"] },
        //                     then: {
        //                         $cond: {
        //                             if: { $gt: [{ $size: "$userDetails" }, 0] },
        //                             then: { $arrayElemAt: ["$userDetails", 0] },
        //                             else: null
        //                         }
        //                     },
        //                     else: "$user"
        //                 }
        //             }
        //         }
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
        //                                 { $eq: ['$type', "post"] },
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
        //         $addFields: {
        //             reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
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
        //             user: 1,
        //             target: 1,
        //             reaction: 1,
        //             likesCount: { $ifNull: ['$likesCount.count', 0] },
        //             commentsCount: { $ifNull: ['$commentsCount.count', 0] },
        //             bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
        //             isLikedByUser: 1,
        //             targetId: 1,
        //             type: 1,
        //             isBookmarkedByUser: 1,
        //             updatedAt: 1,
        //             createdAt: 1,
        //         },
        //     },
        // ]);

        const post = await this.postModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            // Look up possible targets from different collections
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
            // Handle user object ID conversion for group posts
            {
                $addFields: {
                    userObjectId: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $eq: [{ $type: "$user" }, "string"] },
                                    then: { $toObjectId: "$user" },
                                    else: "$user"
                                }
                            },
                            else: null
                        }
                    }
                }
            },
            // Add shared post lookup
            {
                $lookup: {
                    from: 'posts',
                    let: { sharedPostId: '$sharedPost' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ['$$sharedPostId', null] },
                                        { $eq: ['$_id', '$$sharedPostId'] }
                                    ]
                                }
                            }
                        },
                        // Target lookup for shared post
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
                        // Handle user object ID for shared post
                        {
                            $addFields: {
                                userObjectId: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $eq: [{ $type: "$user" }, "string"] },
                                                then: { $toObjectId: "$user" },
                                                else: "$user"
                                            }
                                        },
                                        else: null
                                    }
                                }
                            }
                        },
                        // User lookup for shared post (for group posts)
                        {
                            $lookup: {
                                from: "users",
                                let: { userId: "$userObjectId", postType: "$type" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$$postType", "group"] },
                                                    { $eq: ["$_id", "$$userId"] }
                                                ]
                                            }
                                        }
                                    },
                                    { $limit: 1 }
                                ],
                                as: "userDetails"
                            }
                        },
                        // Regular user lookup for shared post
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'regularUserDetails'
                            }
                        },
                        // Combine user lookups for shared post
                        {
                            $addFields: {
                                user: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$userDetails" }, 0] },
                                                then: { $arrayElemAt: ["$userDetails", 0] },
                                                else: null
                                            }
                                        },
                                        else: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                                then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                                else: "$user"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        // Handle likes for shared post
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
                        // Handle bookmarks for shared post
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
                        // Handle counters for shared post
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
                        // Combine fields for shared post
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
                                reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                                isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                            }
                        },
                        // Project shared post fields
                        {
                            $project: {
                                _id: 1,
                                content: 1,
                                media: 1,
                                user: 1,
                                promotion: 1,
                                isUploaded: 1,
                                target: 1,
                                reaction: 1,
                                likesCount: { $ifNull: ['$likesCount.count', 0] },
                                commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                                bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                                isLikedByUser: 1,
                                targetId: 1,
                                type: 1,
                                isBookmarkedByUser: 1,
                                updatedAt: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    as: 'sharedPostDetails'
                }
            },
            // User lookup for main post - for group posts
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userObjectId", postType: "$type" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$postType", "group"] },
                                        { $eq: ["$_id", "$$userId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "userDetails"
                }
            },
            // Regular user lookup for main post
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'regularUserDetails'
                }
            },
            // Combine user lookups for main post
            {
                $addFields: {
                    user: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $gt: [{ $size: "$userDetails" }, 0] },
                                    then: { $arrayElemAt: ["$userDetails", 0] },
                                    else: null
                                }
                            },
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                    then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                    else: "$user"
                                }
                            }
                        }
                    }
                }
            },
            // Handle likes for main post
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
            // Handle bookmarks for main post
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
            // Handle counters for main post
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
            // Combine fields for main post
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
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
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
            // Final projection
            {
                $project: {
                    _id: 1,
                    content: 1,
                    media: 1,
                    user: 1,
                    promotion: 1,
                    isUploaded: 1,
                    target: 1,
                    reaction: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    isBookmarkedByUser: 1,
                    updatedAt: 1,
                    createdAt: 1,
                    sharedPost: {
                        $cond: {
                            if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
                            then: { $arrayElemAt: ['$sharedPostDetails', 0] },
                            else: null
                        }
                    }
                },
            },
        ]);

        return post
    }


    async feed(userId, cursor) {
        const limit = 12

        let visibility = {
            $or: [
                { visibility: 'public' },
                { $and: [{ visibility: 'private' }, { user: new Types.ObjectId(userId) }] }
            ]
        }

        const query = cursor ? { createdAt: { $lt: new Date(cursor) }, ...visibility } : { ...visibility };

        // const posts = await this.postModel.aggregate([
        //     { $match: query },
        //     { $sort: { createdAt: -1 } },
        //     { $limit: limit + 1 },
        //     // {
        //     //     $lookup: {
        //     //         from: 'viewedposts',
        //     //         let: { postId: '$_id' },
        //     //         pipeline: [
        //     //             {
        //     //                 $match: {
        //     //                     $expr: {
        //     //                         $and: [
        //     //                             { $eq: ['$userId', new Types.ObjectId(userId)] },
        //     //                             { $eq: ['$postId', '$$postId'] }
        //     //                         ]
        //     //                     }
        //     //                 }
        //     //             }
        //     //         ],
        //     //         as: 'viewed'
        //     //     }
        //     // },
        //     // {
        //     //     $match: { viewed: { $size: 0 } }
        //     // },
        //     {
        //         $lookup: {
        //             from: 'users',
        //             localField: 'targetId',
        //             foreignField: '_id',
        //             as: 'userTarget'
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: 'groups',
        //             localField: 'targetId',
        //             foreignField: '_id',
        //             as: 'groupTarget'
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: 'pages',
        //             localField: 'targetId',
        //             foreignField: '_id',
        //             as: 'pageTarget'
        //         }
        //     },
        //     {
        //         $addFields: {
        //             userObjectId: {
        //                 $cond: {
        //                     if: { $eq: ["$type", "group"] },
        //                     then: {
        //                         $cond: {
        //                             if: { $eq: [{ $type: "$user" }, "string"] },
        //                             then: { $toObjectId: "$user" },
        //                             else: "$user"
        //                         }
        //                     },
        //                     else: null
        //                 }
        //             }
        //         }
        //     },

        //     {
        //         $lookup: {
        //             from: 'posts',
        //             let: { sharedPostId: '$sharedPost' },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $ne: ['$$sharedPostId', null] },
        //                                 { $eq: ['$_id', '$$sharedPostId'] }
        //                             ]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $lookup: {
        //                         from: 'users',
        //                         localField: 'user',
        //                         foreignField: '_id',
        //                         as: 'userDetails'
        //                     }
        //                 },
        //                 {
        //                     $addFields: {
        //                         user: {
        //                             $cond: {
        //                                 if: { $gt: [{ $size: '$userDetails' }, 0] },
        //                                 then: { $arrayElemAt: ['$userDetails', 0] },
        //                                 else: '$user'
        //                             }
        //                         }
        //                     }
        //                 },
        //                 // Add other lookups that you need for the shared post
        //             ],
        //             as: 'sharedPostDetails'
        //         }
        //     },


        //     {
        //         $lookup: {
        //             from: "users",
        //             let: { userId: "$userObjectId", postType: "$type" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ["$$postType", "group"] },
        //                                 { $eq: ["$_id", "$$userId"] }
        //                             ]
        //                         }
        //                     }
        //                 },
        //                 { $limit: 1 }
        //             ],
        //             as: "userDetails"
        //         }
        //     },
        //     {
        //         $addFields: {
        //             user: {
        //                 $cond: {
        //                     if: { $eq: ["$type", "group"] },
        //                     then: {
        //                         $cond: {
        //                             if: { $gt: [{ $size: "$userDetails" }, 0] },
        //                             then: { $arrayElemAt: ["$userDetails", 0] },
        //                             else: null
        //                         }
        //                     },
        //                     else: "$user"
        //                 }
        //             }
        //         }
        //     },
        //     // {
        //     //     $lookup: {
        //     //         from: 'promotions',
        //     //         localField: '_id',
        //     //         foreignField: 'postId',
        //     //         pipeline: [
        //     //             { $match: { active: 1 } }  // Only include active promotions
        //     //         ],
        //     //         as: 'promotion'
        //     //     }
        //     // },


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
        //                                 { $eq: ['$type', "post"] },
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
        //         $addFields: {
        //             target: {
        //                 $switch: {
        //                     branches: [
        //                         { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
        //                         { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
        //                         { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
        //                     ],
        //                     default: null
        //                 }
        //             },
        //             likesCount: {
        //                 $ifNull: [
        //                     { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
        //                     0
        //                 ]
        //             },
        //             commentsCount: {
        //                 $ifNull: [
        //                     { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
        //                     0
        //                 ]
        //             },
        //             bookmarksCount: {
        //                 $ifNull: [
        //                     { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
        //                     0
        //                 ]
        //             },
        //             // promotion: '$promotion',
        //             isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
        //             reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
        //             isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
        //         }
        //     },

        //     {
        //         $project: {
        //             _id: 1,
        //             content: 1,
        //             media: 1,
        //             user: 1,
        //             promotion: 1,
        //             isUploaded: 1,
        //             target: 1,
        //             reaction: 1,
        //             likesCount: { $ifNull: ['$likesCount.count', 0] },
        //             commentsCount: { $ifNull: ['$commentsCount.count', 0] },
        //             bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
        //             isLikedByUser: 1,
        //             targetId: 1,
        //             type: 1,
        //             isBookmarkedByUser: 1,
        //             updatedAt: 1,
        //             createdAt: 1,
        //             sharedPost: {
        //                 $cond: {
        //                     if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
        //                     then: { $arrayElemAt: ['$sharedPostDetails', 0] },
        //                     else: null
        //                 }
        //             }

        //         },
        //     },
        // ]);

        const posts = await this.postModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            // Target lookup section - Look up possible targets from different collections
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
            // Handle user object ID conversion for group posts
            {
                $addFields: {
                    userObjectId: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $eq: [{ $type: "$user" }, "string"] },
                                    then: { $toObjectId: "$user" },
                                    else: "$user"
                                }
                            },
                            else: null
                        }
                    }
                }
            },
            // Shared post lookup with enhanced structure to match main post
            {
                $lookup: {
                    from: 'posts',
                    let: { sharedPostId: '$sharedPost' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ['$$sharedPostId', null] },
                                        { $eq: ['$_id', '$$sharedPostId'] }
                                    ]
                                }
                            }
                        },
                        // Target lookup for shared post
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
                        // Handle user for shared post
                        {
                            $addFields: {
                                userObjectId: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $eq: [{ $type: "$user" }, "string"] },
                                                then: { $toObjectId: "$user" },
                                                else: "$user"
                                            }
                                        },
                                        else: null
                                    }
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                let: { userId: "$userObjectId", postType: "$type" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$$postType", "group"] },
                                                    { $eq: ["$_id", "$$userId"] }
                                                ]
                                            }
                                        }
                                    },
                                    { $limit: 1 }
                                ],
                                as: "userDetails"
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'regularUserDetails'
                            }
                        },
                        {
                            $addFields: {
                                user: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$userDetails" }, 0] },
                                                then: { $arrayElemAt: ["$userDetails", 0] },
                                                else: null
                                            }
                                        },
                                        else: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                                then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                                else: "$user"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        // Handle likes for shared post
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
                        // Handle bookmarks for shared post
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
                        // Handle counters for shared post
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
                        // Combine fields for shared post
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
                                reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                                isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                            }
                        },
                        // Project shared post fields
                        {
                            $project: {
                                _id: 1,
                                content: 1,
                                media: 1,
                                user: 1,
                                promotion: 1,
                                isUploaded: 1,
                                target: 1,
                                reaction: 1,
                                likesCount: { $ifNull: ['$likesCount.count', 0] },
                                commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                                bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                                isLikedByUser: 1,
                                targetId: 1,
                                type: 1,
                                isBookmarkedByUser: 1,
                                updatedAt: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    as: 'sharedPostDetails'
                }
            },
            // User lookup for main post
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userObjectId", postType: "$type" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$postType", "group"] },
                                        { $eq: ["$_id", "$$userId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "userDetails"
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'regularUserDetails'
                }
            },
            {
                $addFields: {
                    user: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $gt: [{ $size: "$userDetails" }, 0] },
                                    then: { $arrayElemAt: ["$userDetails", 0] },
                                    else: null
                                }
                            },
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                    then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                    else: "$user"
                                }
                            }
                        }
                    }
                }
            },
            // Bookmark lookup for main post
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
            // Like lookup for main post
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
            // Counter lookup for main post
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
            // Combine fields for main post
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
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                }
            },
            // Final projection
            {
                $project: {
                    _id: 1,
                    content: 1,
                    media: 1,
                    user: 1,
                    promotion: 1,
                    isUploaded: 1,
                    target: 1,
                    reaction: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    isBookmarkedByUser: 1,
                    updatedAt: 1,
                    createdAt: 1,
                    sharedPost: {
                        $cond: {
                            if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
                            then: { $arrayElemAt: ['$sharedPostDetails', 0] },
                            else: null
                        }
                    }
                },
            },
        ]);

        // if (posts.length == 0) {
        //     const posts = await this.viewPostsModel.aggregate([
        //         {
        //             $lookup: {
        //                 from: "posts",
        //                 localField: "postId",
        //                 foreignField: "_id",
        //                 as: "post"
        //             }
        //         },
        //         {
        //             $unwind: "$post"
        //         },
        //         {
        //             $lookup: {
        //                 from: 'users',
        //                 localField: 'post.targetId',
        //                 foreignField: '_id',
        //                 as: 'userTarget'
        //             }
        //         },
        //         {
        //             $lookup: {
        //                 from: 'groups',
        //                 localField: 'post.targetId',
        //                 foreignField: '_id',
        //                 as: 'groupTarget'
        //             }
        //         },
        //         {
        //             $lookup: {
        //                 from: 'pages',
        //                 localField: 'post.targetId',
        //                 foreignField: '_id',
        //                 as: 'pageTarget'
        //             }
        //         },

        //         {
        //             $lookup: {
        //                 from: 'promotions',
        //                 localField: 'post._id',
        //                 foreignField: 'postId',
        //                 pipeline: [
        //                     { $match: { active: 1 } }  // Only include active promotions
        //                 ],
        //                 as: 'promotion'
        //             }
        //         },

        //         {

        //             $lookup: {
        //                 from: 'bookmarks',
        //                 let: { postId: 'post._id' },
        //                 pipeline: [
        //                     {
        //                         $match: {
        //                             $expr: {
        //                                 $and: [
        //                                     { $eq: ['$postId', '$$postId'] },
        //                                     { $eq: ['$userId', new Types.ObjectId(userId)] },
        //                                 ],
        //                             },
        //                         },
        //                     },
        //                 ],
        //                 as: 'userBookmark',
        //             },
        //         },
        //         {

        //             $lookup: {
        //                 from: 'likes',
        //                 let: { postId: 'post._id' },
        //                 pipeline: [
        //                     {
        //                         $match: {
        //                             $expr: {
        //                                 $and: [
        //                                     { $eq: ['$targetId', '$$postId'] },
        //                                     { $eq: ['$userId', new Types.ObjectId(userId)] },
        //                                     { $eq: ['$type', "post"] },
        //                                 ],
        //                             },
        //                         },
        //                     },
        //                 ],
        //                 as: 'userLike',
        //             },
        //         },

        //         {
        //             $lookup: {
        //                 from: 'counters',
        //                 let: { postId: 'post._id' },
        //                 pipeline: [
        //                     {
        //                         $match: {
        //                             $expr: {
        //                                 $and: [
        //                                     { $eq: ['$targetId', '$$postId'] },
        //                                     { $eq: ['$name', 'post'] },
        //                                     { $in: ['$type', ['likes', 'comments', 'bookmarks']] }
        //                                 ]
        //                             }
        //                         }
        //                     }
        //                 ],
        //                 as: 'counters'
        //             }
        //         },
        //         {
        //             $addFields: {
        //                 target: {
        //                     $switch: {
        //                         branches: [
        //                             { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
        //                             { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
        //                             { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
        //                         ],
        //                         default: null
        //                     }
        //                 },
        //                 likesCount: {
        //                     $ifNull: [
        //                         { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
        //                         0
        //                     ]
        //                 },
        //                 commentsCount: {
        //                     $ifNull: [
        //                         { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
        //                         0
        //                     ]
        //                 },
        //                 bookmarksCount: {
        //                     $ifNull: [
        //                         { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
        //                         0
        //                     ]
        //                 },
        //                 promotion: '$promotion',
        //                 isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
        //                 isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
        //             }

        //         },

        //         {
        //             $project: {
        //                 _id: "$post._id",
        //                 content: "$post.content",
        //                 media: "$post.media",
        //                 user: "$post.user",
        //                 promotion: "$post.promotion",
        //                 target: 1,
        //                 likesCount: { $ifNull: ['$likesCount.count', 0] },
        //                 commentsCount: { $ifNull: ['$commentsCount.count', 0] },
        //                 bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
        //                 isLikedByUser: 1,
        //                 targetId: "$post.targetId",
        //                 type: "$post.type",
        //                 isBookmarkedByUser: 1,
        //                 viewed: true,
        //                 updatedAt: "$post.updatedAt",
        //                 createdAt: "$post.createdAt",
        //             },
        //         },
        //     ])
        //     console.log(posts)

        //     const hasNextPage = posts.length > limit;
        //     const _posts = hasNextPage ? posts.slice(0, -1) : posts;
        //     const nextCursor = hasNextPage ? _posts[_posts.length - 1].createdAt.toISOString() : null;

        //     const results = { posts: _posts, nextCursor, viewed: true };
        //     return results
        // }

        const hasNextPage = posts.length > limit;
        const _posts = hasNextPage ? posts.slice(0, -1) : posts;
        const nextCursor = hasNextPage ? _posts[_posts.length - 1].createdAt.toISOString() : null;

        const results = { posts: _posts, nextCursor };
        return results
    }

    async viewPost({ userId, postId, type }: SViewPost) {
        const post = await this.postModel.findById(postId)
        if (!post) {
            throw new BadRequestException()
        }

        if (String(post.user) == userId) {
            return null
        }

        if (type == 'normal') {
            const viewedPost = await this.viewPostsModel.updateOne(
                { type, userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) },
                { $setOnInsert: { type, userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) } },
                { upsert: true }
            )
            return viewedPost
        }

        if (type !== 'promotion') {
            throw new BadRequestException()
        }


        const viewedPost = await this.viewPostsModel.updateOne(
            { type, userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) },
            { $setOnInsert: { type, userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) } },
            { upsert: true }
        )

        const _promotedPost = await this.promotionModel.findOne({ postId: new Types.ObjectId(postId), active: 1 })
        if ((Number(_promotedPost.reach) + 1) >= Number(_promotedPost.reachTarget) && _promotedPost.reachStatus !== ReachStatus.COMPLETED) {
            _promotedPost.reachStatus = ReachStatus.COMPLETED
            _promotedPost.active = 0
            _promotedPost.reach = Number(_promotedPost.reach) + 1
            _promotedPost.save()
            return viewedPost
        }

        if (viewedPost.upsertedCount > 0 && (Number(_promotedPost.reach) + 1) < Number(_promotedPost.reachTarget)) {
            await this.promotionModel.findOneAndUpdate({ postId: new Types.ObjectId(postId), active: 1 }, { $inc: { reach: 1 } })
        }
        return viewedPost
    }

    async bulkViewPosts({ userId, postIds }: SBulkViewPost) {

        try {
            let viewPosts = postIds.map(async (postId) => {
                const post = await this.postModel.findById(postId)
                if (!post) {
                    throw new BadRequestException()
                }
                // if (String(post.user) != userId) {
                await this.viewPostsModel.updateOne(
                    { type: "normal", userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) },
                    { $setOnInsert: { type: 'normal', userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) } },
                    { upsert: true }
                )
                // }
            })

            if (Promise.all(viewPosts)) {
                return true
            }
        } catch (error) {
            return false
        }

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
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
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
                    reaction: 1,
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

    async postPromotion({ postId, userId, promotionDetails, isApp }: SPostPromotion) {

        const promotion = await this.promotionModel.findOne({ postId: new Types.ObjectId(postId), user: userId, active: 1 })

        if (promotion) {
            throw new BadRequestException(POST_PROMOTION.ALREADY_ACTIVE)
        }

        await this.locationService.isValidRegisteredAddress(promotionDetails.targetAddress)

        const totalAmount = (promotionDetails.reachTarget / 1000) * 0.5

        const _promotion = await this.promotionModel.create({ user: userId, active: 0, postId: new Types.ObjectId(postId), reachTarget: promotionDetails.reachTarget, paymentDetails: { totalAmount, status: PAYMENT_STATES.PENDING }, targetAdress: promotionDetails.targetAddress })
        console.log(_promotion)

        let productDetails = [{ price_data: { unit_amount: promotionDetails.reachTarget * 0.05, currency: CURRENCIES.USD, product_data: { name: "post promotion", description: "post promotion" } }, quantity: 1 }]

        const sessionId = await this.paymentService.stripeCheckout(productDetails, userId, _promotion._id.toString(), totalAmount, isApp)
        return sessionId
    }



    async promotionPaymentSuccess(promotionId: string, totalAmount: string, paymentIntentId: string) {
        const promotion = await this.promotionModel.findByIdAndUpdate(promotionId, { $set: { active: 1, paymentDetails: { totalAmount, status: PAYMENT_STATES.PAID, paymentProvider: PAYMENT_PROVIDERS.STRIPE, paymentIntentId }, reachStatus: ReachStatus.IN_PROGRESS } })
        await this.metricsAggregatorService.incrementCount(null, "count", "campaigns")
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
                $addFields: {
                    userObjectId: {
                        $toObjectId: "$post.user",
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userObjectId", postType: "$post.type" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$postType", "group"] },
                                        { $eq: ["$_id", "$$userId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "userDetails"
                }
            },
            {
                $addFields: {
                    user: {
                        $cond: {
                            if: { $gt: [{ $size: "$userDetails" }, 0] },
                            then: { $arrayElemAt: ["$userDetails", 0] },
                            else: null
                        }
                    },
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
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },


                }
            },
            {
                $addFields: {
                    "post.likesCount": { $ifNull: ['$likesCount.count', 0] },
                    "post.commentsCount": { $ifNull: ['$commentsCount.count', 0] },
                    "post.bookmarksCount": { $ifNull: ['$bookmarksCount.count', 0] },
                    "post.reaction": "$reaction"
                }
            },
            {
                $project: {
                    post: 1,
                    target: 1,
                    user: 1,
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

    async toggleLike({ userId, targetId, type, authorId, _targetId, targetType, reaction }: { userId: string, targetId: string, type: 'post' | 'comment' | 'reply', authorId?: string, targetType?: string, _targetId?: string, reaction?: string }): Promise<boolean> {

        let filter: {
            userId: Types.ObjectId,
            targetId: Types.ObjectId,
            type: string,
            reaction?: string
        } = {
            userId: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(targetId),
            type,
        };

        const reactions = {
            'Like': '👍',
            "Love": '❤️',
            'Haha': '😆',
            'Wow': '🤩',
            'Sad': '😢',
            'Angry': '😠',
            'Applause': '👏',
            'Fire': '🔥'
        }

        let reactionFilter;

        if (reaction) {
            reactionFilter = { ...filter, reaction }
        }

        const interactionFilter = {
            userId: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(_targetId),
        }

        const deleteResult = await this.likeModel.deleteOne(filter);

        let reactionDeleteResult;
        if (reactionFilter) {
            reactionDeleteResult = await this.likeModel.deleteOne(reactionFilter)
        }

        if (reactionDeleteResult && reactionDeleteResult.deletedCount === 0 && deleteResult.deletedCount === 0) {
            await this.likeModel.create(reactionFilter);
            if (userId != authorId) {
                await this.notificationService.createNotification(
                    {
                        from: new Types.ObjectId(userId),
                        user: new Types.ObjectId(authorId),
                        targetId: new Types.ObjectId(targetId),
                        type,
                        targetType,
                        value: reaction ? `has reacted on your ${type} (${reactions[reaction] || reaction})` : `has liked your ${type}`
                    }
                )
            }

            await this.metricsAggregatorService.incrementCount(filter.targetId, type, "likes")

            if (targetType == 'user' || targetType == "page") {
                let updatedInteraction = await this.followerModel.updateOne({ follower: interactionFilter.userId, targetId: interactionFilter.targetId },
                    { $inc: { interactionScore: 1 } }
                )
            }
            if (targetType == 'group') {
                let updatedInteraction = await this.memberModel.updateOne({ member: interactionFilter.userId, groupId: interactionFilter.targetId },
                    { $inc: { interactionScore: 1 } }
                )
            }
            return true;
        }

        if ((deleteResult.deletedCount === 0 && !reactionDeleteResult) || (deleteResult.deletedCount === 0 && reactionDeleteResult.deletedCount === 1)) {

            await this.likeModel.create(filter);
            if (userId != authorId) {
                await this.notificationService.createNotification(
                    {
                        from: new Types.ObjectId(userId),
                        user: new Types.ObjectId(authorId),
                        targetId: new Types.ObjectId(targetId),
                        type,
                        targetType,
                        value: reaction ? `has reacted on your ${type} (${reactions[reaction] || reaction})` : `has liked your ${type}`
                    }
                )
            }

            await this.metricsAggregatorService.incrementCount(filter.targetId, type, "likes")

            if (targetType == 'user' || targetType == "page") {
                console.log(filter)
                let updatedInteraction = await this.followerModel.updateOne({ follower: interactionFilter.userId, targetId: interactionFilter.targetId },
                    { $inc: { interactionScore: 1 } }
                )
            }
            if (targetType == 'group') {
                let updatedInteraction = await this.memberModel.updateOne({ member: interactionFilter.userId, groupId: interactionFilter.targetId },
                    { $inc: { interactionScore: 1 } }
                )
            }
            return true;
        }


        if (targetType == 'user' || targetType == "page") {
            let updatedInteraction = await this.followerModel.updateOne({ follower: interactionFilter.userId, targetId: interactionFilter.targetId },
                { $inc: { interactionScore: -1 } }
            )
        }

        if (targetType == 'group') {
            let updatedInteraction = await this.memberModel.updateOne({ member: interactionFilter.userId, groupId: interactionFilter.targetId },
                { $inc: { interactionScore: -1 } }
            )
        }

        await this.metricsAggregatorService.decrementCount(filter.targetId, type, "likes")
        return false;
    }

    async getBookmarkedPosts(username) {
        const user: any = await this.userService.getUser(username, "bookmarkedPosts")
        return user[0].bookmarkedPosts
    }

    async reportPost(postId: string, { userId, type, reportMessage }) {
        const alreadyReported = await this.reportModel.findOne({ reportedBy: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) })

        if (alreadyReported) {
            throw new BadRequestException("Already Reported")
        }

        const report = await this.reportModel.create({ reportedBy: new Types.ObjectId(userId), type, postId: new Types.ObjectId(postId), reportMessage })
        await this.metricsAggregatorService.incrementCount(null, "count", "reports")

        return report
    }

    async createPost(postData: any) {
        const post = await this.postModel.create({ ...postData })

        return await post.populate({
            path: "user",
            model: "User"
        })
    }

    async createSharedPost(postData: any) {
        const post = await this.postModel.create({ ...postData })

        return await post.populate([
            {
                path: "user",
                model: "User"
            },
            {
                path: "sharedPost",
                model: "Post"
            }
        ])
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
