import { Get, Injectable, Req, Res } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/user';
import { Types } from 'mongoose'

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private readonly userModel: Model<User>) { }

    async getUsers(cursor, search: string) {
        let limit = 50
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        // await this.userModel.findOneAndUpdate({username: 'ahsanullah'}, {isActive: true, isPhoneVerified: true})

        try {

            const query: any = search
                ?
                { $or: [{ username: { $regex: search, $options: 'i' } }], ..._cursor }
                : _cursor;

            try {
                const objectId = new Types.ObjectId(search);
                if (search) {
                    query.$or.push({ _id: objectId });
                }
            } catch (error) {
                console.log(error)
            }
            console.log(search, query)

            const users = await this.userModel.aggregate([
                { $match: query },
                { $sort: { createdAt: -1 } },
                { $limit: limit + 1 },
                {

                    $lookup: {
                        from: 'suspensions',
                        localField: "_id",
                        foreignField: "userId",
                        as: 'suspension',
                    },
                },
                {
                    $addFields: {
                        isSuspended: {
                            $cond: {
                                if: { $gt: [{ $size: "$suspension" }, 0] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $project: {
                        suspension: 0
                    }
                }
            ])

            const hasNextPage = users.length > limit
            const _users = hasNextPage ? users.slice(0, -1) : users
            const nextCursor = hasNextPage ? _users[_users.length - 1].createdAt.toISOString() : null
            const results = { users: _users, nextCursor };
            return results

        } catch (error) {
            return { users: [], nextCursor: null }
        }
    }
}
