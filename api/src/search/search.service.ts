import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group } from 'src/schema/group';
import { Page } from 'src/schema/pages';
import { Post } from 'src/schema/post';
import { User } from 'src/schema/user';

@Injectable()
export class SearchService {

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Post.name) private postModel: Model<Post>,
        @InjectModel(Group.name) private groupModel: Model<Post>,
        @InjectModel(Page.name) private pageModel: Model<Page>
    ) { }

    async search({ query, type }: { query: string, type: string }, userId: string) {
        let _query = query.split(" ")
        if (type == "default") {
            let users = await this.searchUsers(_query.join(""))
            let posts = await this.searchPosts(_query.join(""), userId)
            let groups = await this.searchGroups(_query.join(""))
            let pages = await this.searchPages(_query.join(""))
            return { users, posts, groups, pages }
        }


        if (type == "users") {
            let users = await this.searchUsers(_query.join(""))
            return { users }
        }


        if (type == "posts") {
            let posts = await this.searchPosts(_query.join(""), userId)
            return { posts }
        }

        if (type == "groups") {
            let groups = await this.searchGroups(_query.join(""))
            return { groups }
        }



        if (type == 'pages') {
            let pages = await this.searchPages(_query.join(""))
            return { pages }
        }
    }

    async searchSuggestions(query: string) {
        let _query = query.split(" ")
        const regexPattern = new RegExp(_query.join(""), 'i');

        const aggregationPipeline = [
            {
                $match: {
                    $or: [
                        { username: { $regex: regexPattern }, isActive: true },
                        { handle: { $regex: regexPattern } },
                    ],
                },
            },
            {
                $project: {
                    _id: 0,
                    value: { $ifNull: ['$username', '$handle'] },
                    type: {
                        $cond: {
                            if: { $ifNull: ['$username', false] },
                            then: 'user',
                            else: { $cond: [{ $ifNull: ['$handle', false] }, 'group', 'page'] },
                        },
                    },
                },
            },
            {
                $limit: 10,
            },
        ];

        const [userResults, groupResults, pageResults] = await Promise.all([
            this.userModel.aggregate(aggregationPipeline),
            this.groupModel.aggregate(aggregationPipeline),
            this.pageModel.aggregate(aggregationPipeline),
        ]);

        return [...userResults, ...groupResults, ...pageResults]
            .sort((a, b) => a.value.localeCompare(b.value))
            .slice(0, 10);
    }


    async searchPages(query: string) {
        const pattern = new RegExp(`^${query}`)
        // const pages: any = await this.pageModel.find().populate({
        //     model: "User",
        //     path: "user"
        // })

        // if (!pages) {
        //     return []
        // }

        // let _pages = pages.filter(page => pattern.test(page?.user?.username))
        const _pages = await this.pageModel.find({ handle: { $regex: new RegExp(`^${query}`, 'i') } })


        return _pages
    }

    async searchGroups(query: string) {
        const pattern = new RegExp(`^${query}`)
        // const groups: any = await this.groupModel.find().populate({
        //     model: "User",
        //     path: "user"
        // })


        // if (!groups) {
        //     return []
        // }

        // let _groups = groups.filter(group => {
        //     if (group?.user?.username) {
        //         return pattern.test(group?.user?.username)
        //     }
        // })
        const _query = { handle: { $regex: new RegExp(`^${query}`, 'i') } }
        const _groups = await this.groupModel.find(_query)


        return _groups
    }


    async searchPosts(query: string, userId: string) {

        const usernamePattern = new RegExp(`^${query}`, 'i');

        // const filteredPosts = await this.postModel.aggregate([
        //   {
        //     $lookup: {
        //       from: 'users',
        //       localField: 'user',
        //       foreignField: '_id',
        //       as: 'userDetails',
        //     },
        //   },
        //   {
        //     $unwind: '$userDetails',
        //   },
        //   {
        //     $match: {
        //       'userDetails.username': usernamePattern,
        //     },
        //   },
        //   {
        //     $project: {
        //       content: 1,
        //       user: {
        //         _id: '$userDetails._id',
        //         username: '$userDetails.username',
        //       },
        //     },
        //   },
        // ]).exec();

        // return filteredPosts

        // const bookmarks = await this.postModel.aggregate([
        //     {
        //         $lookup: {
        //             from: 'posts',
        //             localField: "postId",
        //             foreignField: "_id",
        //             as: "post"
        //         }
        //     },
        //     {
        //         $unwind: "$post"
        //     },
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
        //             isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
        //             isBookmarkedByUser: true,
        //             'post.target': '$target'

        //         }
        //     },

        //     {

        //         $lookup: {
        //             from: 'likes',
        //             let: { postId: '$postId' },
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
        //         $project: {
        //             post: 1,
        //             target: 1,
        //             targetId: 1,
        //             type: 1,
        //             updatedAt: 1,
        //             createdAt: 1,
        //         },
        //     },
        // ]);
        const pattern = new RegExp(`^${query}`)
        console.log('userid', userId)

        let searchedPosts = await this.postModel.aggregate([
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
                $addFields: {
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
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

                }
            },

            {
                $match: {
                    $or: [
                        { 'target.username': { $regex: pattern } },
                        { 'target.handle': { $regex: pattern } }
                    ]
                }
            },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    isLikedByUser: 1,
                    isBookmarkedByUser: 1,
                    target: 1,
                    media: 1,
                    user: 1,
                    type: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    targetId: 1,
                    updatedAt: 1,
                }
            },
        ])

        return searchedPosts


        // const posts: any = await this.postModel.find().populate({
        //     model: "User",
        //     path: "user"
        // })





        // let _posts = posts.filter(post => pattern.test(post?.user?.username))

        // return _posts

    }
    async searchUsers(query: string) {
        const users = await this.userModel.find({ username: { $regex: new RegExp(`^${query}`, 'i') }, isActive: true })
        return users
    }
}
