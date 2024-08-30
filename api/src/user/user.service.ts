import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FriendRequest } from 'src/schema/friendrequests';
import { User } from 'src/schema/user';
import { Friend } from 'src/schema/friends';
import { Follower } from 'src/schema/followers';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { NotificationService } from 'src/notification/notification.service';
import { CryptoService } from 'src/crypto/crypto.service';
import { Countries } from 'src/schema/countries';
import { Cities } from 'src/schema/cities';


@Injectable()
export class UserService {

    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(FriendRequest.name) private readonly friendRequestModel: Model<FriendRequest>,
        @InjectModel(Friend.name) private readonly friendModel: Model<Friend>,
        @InjectModel(Follower.name) private readonly followerModel: Model<Follower>,
        @InjectModel(Countries.name) private readonly countriesModel: Model<Countries>,
        @InjectModel(Cities.name) private readonly citiesModel: Model<Cities>,
        private readonly metricsAggregatorService: MetricsAggregatorService,
        private readonly cryptoService: CryptoService
    ) {

    }

    async isValidAddress({country, city}: {country: string, city: string}) {
        const isValidCountry = await this.countriesModel.findOne({name: country})
        const isValidCity = await this.citiesModel.findOne({name: city})
        if(!isValidCountry || isValidCity){
            throw new BadRequestException("Invalid Address")
        }

        return true
    }

    async getCities(country: string) {
        const cities = await this.citiesModel.find({country})
        return cities
    }

    async seedCountries() {
         await this.countriesModel.create([
            {name: 'Pakistan', code: 92, shortName: "PK" },
            {name: 'United States America', code: 68, shortName: "USA" }
         ])
         
         await this.citiesModel.create([
            {name: "Karachi", country: "Pakistan"}, 
            {name: "Islamabad", country: "Pakistan"}, 
            {name: "Washington", country: "United States America"}
        ])
        return true
    }

    async createUser(user: { firstname: string, lastname: string, username: string, email: string, password: string, confirmPassword: string, address: { country?: string, city?: string, area?: string, }, phone: string, phoneSecret: string, emailSecret: string, tempSecret: string }): Promise<any> {
        const { firstname, lastname, username, email, password, confirmPassword, address, phone, emailSecret, phoneSecret, tempSecret } = user

        if (password !== confirmPassword) {
            throw new BadRequestException("provide correct username or password")
        }

        let hashedPassword = await this.cryptoService.hash(password, 16)

        const _user = await this.userModel.create({ firstname, lastname, username, email, password: hashedPassword, phone, address, phoneSecret, emailSecret, tempSecret })
        return _user
    }

    async getUsers(): Promise<any> {
        return this.userModel.find()
    }

    async getFriends(cursor, userId, groupId) {
        console.log(groupId, ' group id')
        console.log(userId, 'friends')
        const limit = 5
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        let query = { ..._cursor, user: new Types.ObjectId(userId) }

        const friends = await this.friendModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },

            {
                $lookup: {
                    from: 'members',
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
                    from: 'users',
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
        // this.cacheService.set(cacheKey, JSON.stringify(results), 300)

        return results
    }


    async getFriendRequests(cursor, userId) {
        console.log(userId, 'friendrequests')
        const limit = 5
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        let query = { ..._cursor, reciever: new Types.ObjectId(userId) }
        console.log(await this.friendModel.find())

        const friendRequests = await this.friendRequestModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: 'users',
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
        console.log(friendRequests)



        const hasNextPage = friendRequests.length > limit;
        const _friendRequests = hasNextPage ? friendRequests.slice(0, -1) : friendRequests;
        const nextCursor = hasNextPage ? _friendRequests[_friendRequests.length - 1].createdAt.toISOString() : null;

        const results = { friendRequests: _friendRequests, nextCursor };
        // this.cacheService.set(cacheKey, JSON.stringify(results), 300)

        return results
    }

    async toggleRequest(userId: string, recepientId: string): Promise<boolean> {
        const filter = {
            sender: new Types.ObjectId(userId),
            reciever: new Types.ObjectId(recepientId)
        }

        // await this.friendRequestModel.deleteMany();

        const deleteResult = await this.friendRequestModel.deleteOne(filter);
        console.log(deleteResult)
        if (deleteResult.deletedCount === 0) {
            const request = await this.friendRequestModel.create(filter);
            // await this.notificationService.createNotification(
            //     {
            //         from: new Types.ObjectId(userId),
            //         user: new Types.ObjectId(recepientId),
            //         targetId: new Types.ObjectId(recepientId),
            //         type: "user",
            //         value: "sent you a friend request"
            //     }
            // )
            return true;
        }

        return false;
    }


    async toggleFollow(userId, recepientId) {
        const filter = {
            follower: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(recepientId),
            type: "user"
        };

        const deleteResult = await this.followerModel.deleteOne(filter);

        if (deleteResult.deletedCount === 0) {
            await this.followerModel.create(filter);
            await this.metricsAggregatorService.incrementCount(filter.targetId, "user", "followers")
            // await this.notificationService.createNotification(
            //     {
            //         from: new Types.ObjectId(userId),
            //         user: new Types.ObjectId(recepientId),
            //         targetId: new Types.ObjectId(recepientId),
            //         type: "user",
            //         value: "has followed you"
            //     }
            // )
            return true;
        }
        await this.metricsAggregatorService.decrementCount(filter.targetId, "user", "followers")
        return false;
    }

    async acceptFriendRequest(userId: string, recepientId: string) {
        console.log(recepientId, userId)
        const filter = [{
            sender: new Types.ObjectId(userId),
            reciever: new Types.ObjectId(recepientId),
        }, {
            reciever: new Types.ObjectId(userId),
            sender: new Types.ObjectId(recepientId),
        }]

        const deleteResult = await this.friendRequestModel.deleteOne({ $or: filter });
        console.log(deleteResult)
        if (deleteResult.deletedCount === 0) {
            throw new BadRequestException()
        }

        let friends = await this.friendModel.insertMany([
            { user: new Types.ObjectId(userId), friend: new Types.ObjectId(recepientId) },
            { user: new Types.ObjectId(recepientId), friend: new Types.ObjectId(userId) }
        ])
        // await this.notificationService.createNotification(
        //     {
        //         from: new Types.ObjectId(userId),
        //         user: new Types.ObjectId(recepientId),
        //         targetId: new Types.ObjectId(recepientId),
        //         type: "user",
        //         value: "accepted your friend request"
        //     }
        // )
        await this.metricsAggregatorService.incrementCount(filter[0].sender, "user", "friends")
        await this.metricsAggregatorService.incrementCount(filter[0].reciever, "user", "friends")

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
            throw new BadRequestException("error while removing friends")
        }

        await this.metricsAggregatorService.decrementCount(filter.user, "user", "friends")
        await this.metricsAggregatorService.decrementCount(filter.friend, "user", "friends")

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

    async getUser(username: string, populate?: string, userId?: string) {
        console.log(username)

        if (populate) {
            let user = await this.userModel.find({ username }).populate(populate)
            return user
        }

        let user = await this.userModel.aggregate([
            { $match: { username } },
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
                    from: "followers",
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

            // {

            //     $lookup: {
            //         from: 'friendrequests',
            //         let: { userId: '$_id', areFriends: '$areFriends' },
            //         pipeline: [
            //             {
            //                 $match: {
            //                     $expr: {
            //                         $and: [
            //                             { $eq: ["$$areFriends", false] },
            //                             {
            //                                 $or: [
            //                                     { $and: [{ $eq: ["$reciever", '$$userId'] }, [{ $eq: ["$sender", new Types.ObjectId(userId)] }]] },
            //                                     { $and: [{ $eq: ["$sender", '$$userId'] }, [{ $eq: ["$reciever", new Types.ObjectId(userId)] }]] },
            //                                 ],
            //                             }
            //                         ]

            //                     }
            //                 },
            //             },
            //         ],
            //         as: 'friendRequest',
            //     },
            // },

            {
                $lookup: {
                    from: 'counters',
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
                    from: 'friendrequests',
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
                    email: 1,
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
                                    // if: { $gt: [{ $size: "$friendRequest" }, 0] },
                                    // then: {
                                    //     exists: true,
                                    //     isRecievedByUser: { $eq: [{ $arrayElemAt: ["$friendRequest.sender", 0] }, "$_id"] },
                                    //     isSentByUser: { $eq: [{ $arrayElemAt: ["$friendRequest.reciever", 0] }, "$_id"] },
                                    // },
                                    // else: {
                                    //     exists: false,
                                    //     isSentByUser: false,
                                    //     isRecievedByUser: false,
                                    // }
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
        return deletedUser
    }

    async findUser(username: string): Promise<any> {
        let user = await this.userModel.findOne({ $or: [{ username }, { email: username }], })
        return user
    }
}