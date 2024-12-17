import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FriendRequest } from 'src/schema/friendrequests';
import { User } from 'src/schema/user';
import { Friend } from 'src/schema/friends';
import { Follower } from 'src/schema/followers';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { CryptoService } from 'src/crypto/crypto.service';
import { ChatGateway } from 'src/chat/chat.gateway';
import { AccountManagementService } from 'src/account-management/account-management.service';
import { CreateUser } from 'src/utils/interfaces';
import { Error, GENERAL, MODELS } from 'src/utils/enums/global.c';
import { USER } from 'src/utils/enums/user.c';

@Injectable()
export class UserService {

    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(FriendRequest.name) private readonly friendRequestModel: Model<FriendRequest>,
        @InjectModel(Friend.name) private readonly friendModel: Model<Friend>,
        @InjectModel(Follower.name) private readonly followerModel: Model<Follower>,
        private readonly metricsAggregatorService: MetricsAggregatorService,
        private readonly notificationGateway: ChatGateway,
        private readonly cryptoService: CryptoService
    ) {

    }

    async createUser(user: CreateUser): Promise<any> {
        const { firstname, lastname, username, password, confirmPassword, address, phone, tempSecret } = user

        if (password !== confirmPassword) {
            throw new BadRequestException(Error.WRONG_USERNAME_OR_PASSWORD)
        }

        let hashedPassword = await this.cryptoService.hash(password, 16)

        const _user = await this.userModel.create({ firstname, lastname, username, password: hashedPassword, phone, address, tempSecret })

        await this.metricsAggregatorService.incrementCount(null, GENERAL.COUNT, USER.USERS)

        return _user
    }

    async getUsers(): Promise<any> {
        return this.userModel.find()
    }


    async areFriends(userId: string, friendId: string): Promise<any> {
        console.log(userId, 'user Id', friendId, "friend Id")
        const friends = await this.friendModel.findOne({
            $or: [
                { user: new Types.ObjectId(userId), friend: new Types.ObjectId(friendId) },
                { user: new Types.ObjectId(friendId), friend: new Types.ObjectId(userId) }
            ]
        })
        console.log(friends, 'isfrined')

        if (friends) {
            return true
        }

        return false
    }

    async getFriends(cursor, userId, groupId) {
        const limit = 12
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        let query = { ..._cursor, user: new Types.ObjectId(userId) }

        const friends = await this.friendModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },

            {
                $lookup: {
                    from: MODELS.MEMBERS,
                    let: { friendId: '$friend', groupId: new Types.ObjectId(groupId) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$member', '$$friendId'] },
                                        { $eq: ['$groupId', '$$groupId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'groupMembership'
                }
            },
            {
                $lookup: {
                    from: MODELS.USERS,
                    localField: "friend",
                    foreignField: "_id",
                    as: "friend"
                }
            },
            {
                $unwind: "$friend"
            },
            {
                $addFields: {
                    "friend.isGroupMember": { $gt: [{ $size: '$groupMembership' }, 0] }
                }
            },

            {
                $project: {
                    _id: 1,
                    friend: 1,
                    updatedAt: 1,
                    createdAt: 1,
                },
            },
        ]);

        const hasNextPage = friends.length > limit;
        const _friends = hasNextPage ? friends.slice(0, -1) : friends;
        const nextCursor = hasNextPage ? _friends[_friends.length - 1].createdAt.toISOString() : null;

        const results = { friends: _friends, nextCursor };
        return results
    }


    async getFriendRequests(cursor, userId) {
        const limit = 12
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        let query = { ..._cursor, reciever: new Types.ObjectId(userId) }

        const friendRequests = await this.friendRequestModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: MODELS.USERS,
                    localField: "sender",
                    foreignField: "_id",
                    as: "sender"
                }
            },
            {
                $unwind: "$sender"
            },

            {
                $project: {
                    _id: 1,
                    sender: 1,
                    updatedAt: 1,
                    createdAt: 1,
                },
            },
        ]);

        const hasNextPage = friendRequests.length > limit;
        const _friendRequests = hasNextPage ? friendRequests.slice(0, -1) : friendRequests;
        const nextCursor = hasNextPage ? _friendRequests[_friendRequests.length - 1].createdAt.toISOString() : null;

        const results = { friendRequests: _friendRequests, nextCursor };

        return results
    }

    async toggleRequest(userId: string, recepientId: string): Promise<boolean> {
        const filter = {
            sender: new Types.ObjectId(userId),
            reciever: new Types.ObjectId(recepientId)
        }

        const deleteResult = await this.friendRequestModel.deleteOne(filter);
        if (deleteResult.deletedCount === 0) {
            const request = await this.friendRequestModel.create(filter);
            this.metricsAggregatorService.incrementCount(filter.reciever, GENERAL.REQUEST, USER.USER)
            await this.notificationGateway.handleRequest({ user: filter.reciever });
            return true;
        }
        this.metricsAggregatorService.decrementCount(filter.reciever, GENERAL.REQUEST, USER.USER)
        await this.notificationGateway.handleRequest({ user: filter.reciever });

        return false;
    }


    async toggleFollow(userId, recepientId) {
        const filter = {
            follower: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(recepientId),
            type: USER.USER
        };

        const deleteResult = await this.followerModel.deleteOne(filter);

        if (deleteResult.deletedCount === 0) {
            await this.followerModel.create(filter);
            await this.metricsAggregatorService.incrementCount(filter.targetId, USER.USER, GENERAL.FOLLOWERS)

            return true;
        }
        await this.metricsAggregatorService.decrementCount(filter.targetId, USER.USER, GENERAL.FOLLOWERS)
        return false;
    }

    async acceptFriendRequest(userId: string, recepientId: string) {
        const filter = [{
            sender: new Types.ObjectId(userId),
            reciever: new Types.ObjectId(recepientId),
        }, {
            reciever: new Types.ObjectId(userId),
            sender: new Types.ObjectId(recepientId),
        }]

        const deleteResult = await this.friendRequestModel.deleteOne({ $or: filter });

        if (deleteResult.deletedCount === 0) {
            throw new BadRequestException()
        }

        this.metricsAggregatorService.decrementCount(filter[0].sender, GENERAL.REQUEST, USER.USER)
        await this.notificationGateway.handleRequest({ user: filter[0].sender });
        this.metricsAggregatorService.incrementCount(filter[0].reciever, "notification", "user")

        await this.notificationGateway.sendNotification({ user: filter[0].sender, reciever: filter[0].reciever });


        let friends = await this.friendModel.insertMany([
            { user: new Types.ObjectId(userId), friend: new Types.ObjectId(recepientId) },
            { user: new Types.ObjectId(recepientId), friend: new Types.ObjectId(userId) }
        ])

        await this.metricsAggregatorService.incrementCount(filter[0].sender, USER.USER, GENERAL.FRIENDS)
        await this.metricsAggregatorService.incrementCount(filter[0].reciever, USER.USER, GENERAL.FRIENDS)

        return friends
    }

    async removeFriend(userId: string, recepientId: string) {
        console.log(recepientId, userId)
        const filter = {
            user: new Types.ObjectId(userId),
            friend: new Types.ObjectId(recepientId),
        };

        const deleteResult = await this.friendModel.deleteMany(
            {
                $or: [
                    { user: new Types.ObjectId(userId), friend: new Types.ObjectId(recepientId) },
                    { user: new Types.ObjectId(recepientId), friend: new Types.ObjectId(userId) }
                ]
            }
        );

        console.log(deleteResult)
        if (deleteResult.deletedCount !== 2) {
            throw new BadRequestException(Error.REMOVE_FRIENDS)
        }

        await this.metricsAggregatorService.decrementCount(filter.user, USER.USER, GENERAL.FRIENDS)
        await this.metricsAggregatorService.decrementCount(filter.friend, USER.USER, GENERAL.FRIENDS)

        return true
    }

    async rejectFriendRequest(userId: string, recepientId: string) {
        const filter = {
            sender: new Types.ObjectId(userId),
            reciever: new Types.ObjectId(recepientId)
        }

        const deleteResult = await this.friendRequestModel.deleteOne(filter);

        if (deleteResult.deletedCount === 0) {
            throw new BadRequestException()
        }
        return true
    }

    async getRawUser(userId: string) {
        return await this.userModel.findById(userId)
    }


    async userExists(userId) {
        let user = await this.userModel.findById(userId)
        if (user) {
            return true
        }
        return false
    }

    async getUser(username: string, populate?: string, userId?: string) {

        if (populate) {
            let user = await this.userModel.find({ username, isActive: true }).populate(populate)
            return user
        }

        let user = await this.userModel.aggregate([
            { $match: { username, isActive: true } },
            {

                $lookup: {
                    from: 'friends',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {

                                    // $or: [
                                    $and: [{ $eq: ['$user', new Types.ObjectId(userId)] }, { $eq: ['$friend', '$$userId'] }]
                                    // { $and: [{ $eq: ['$friend', '$$userId'] }, { $eq: ['$user', new Types.ObjectId(userId)] }] },
                                    // ],
                                }

                            },
                        },
                    ],
                    as: 'friendshipStatus',
                },
            },
            {
                $lookup: {
                    from: MODELS.FOLLOWERS,
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$targetId", "$$userId"] },
                                        { $eq: ["$follower", new Types.ObjectId(userId)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "followStatus"

                }
            },

            {
                $lookup: {
                    from: MODELS.COUNTERS,
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$userId'] },
                                        { $eq: ['$name', 'user'] },
                                        { $in: ['$type', ['friends', 'followers']] }
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
                    areFriends: { $gt: [{ $size: '$friendshipStatus' }, 0] },
                    isFollowed: { $gt: [{ $size: '$followStatus' }, 0] },
                    friendsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'friends'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    followersCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'followers'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                }
            },
            {
                $lookup: {
                    from: MODELS.FRIEND_REQUESTS,
                    let: { userId: '$_id', areFriends: '$areFriends' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$areFriends", false] },
                                        {
                                            $or: [
                                                { $eq: ["$reciever", '$$userId'] },
                                                { $eq: ["$sender", '$$userId'] }
                                            ]
                                        },
                                        {
                                            $or: [
                                                { $eq: ["$sender", new Types.ObjectId(userId)] },
                                                { $eq: ["$reciever", new Types.ObjectId(userId)] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'friendRequest'
                }
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    profile: 1,
                    cover: 1,
                    firstname: 1,
                    lastname: 1,
                    followersCount: { $ifNull: ['$followersCount.count', 0] },
                    friendsCount: { $ifNull: ['$friendsCount.count', 0] },
                    bio: 1,
                    address: 1,
                    phone: 1,
                    areFriends: 1,
                    isFollowed: 1,
                    friendRequest: {
                        $cond: {
                            if: "$areFriends",
                            then: null,
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: "$friendRequest" }, 0] },
                                    then: {
                                        exists: true,
                                        isSentByUser: { $eq: [{ $arrayElemAt: ["$friendRequest.reciever", 0] }, "$_id"] },
                                        isRecievedByUser: { $eq: [{ $arrayElemAt: ["$friendRequest.sender", 0] }, "$_id"] }
                                    },
                                    else: {
                                        exists: false,
                                        isSentByUser: false,
                                        isReceivedByUser: false
                                    }
                                }
                            }
                        },
                    }
                }
            }
        ])
        return user
    }

    async updateUser(userId: string, updatedDetails: any) {
        let updatedUser = this.userModel.findByIdAndUpdate(userId, { $set: { ...updatedDetails } }, { returnOriginal: false })
        return updatedUser
    }

    async deleteUser(userId: string) {
        let deletedUser = await this.userModel.findByIdAndDelete(userId)
        await this.metricsAggregatorService.decrementCount(null, GENERAL.COUNT, USER.USERS)
        return deletedUser
    }

    async findUser(username: string): Promise<any> {
        let user = await this.userModel.findOne({ username })
        return user
    }
}