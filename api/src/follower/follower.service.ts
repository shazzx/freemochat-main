import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follower } from 'src/schema/followers';

@Injectable()
export class FollowerService {
    constructor(@InjectModel(Follower.name) private readonly followerModel: Model<Follower>) { }


    async getFollowers(cursor, targetId, type) {
        let model = type + 's'
        const limit = 5
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        let query = { ..._cursor, targetId: new Types.ObjectId(targetId), type }

        const followers = await this.followerModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: 'users',
                    localField: "follower",
                    foreignField: "_id",
                    as: "follower"
                }
            },
            {
                $unwind: "$follower"
            },

            {
                $project: {
                    _id: 1,
                    follower: 1,
                    updatedAt: 1,
                    createdAt: 1,
                },
            },
        ]);



        const hasNextPage = followers.length > limit;
        const _followers = hasNextPage ? followers.slice(0, -1) : followers;
        const nextCursor = hasNextPage ? _followers[_followers.length - 1].createdAt.toISOString() : null;

        const results = { followers: _followers, nextCursor };
        // this.cacheService.set(cacheKey, JSON.stringify(results), 300)

        return results
    }
    
    async getRawFollowers(userId: string, type: string) {
        const followers = await this.followerModel.find({ targetId: new Types.ObjectId(userId), type })
        return followers.map(follower => follower.follower.toString());
    }
}
