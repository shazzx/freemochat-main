import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group } from 'src/schema/group';

@Injectable()
export class GroupService {
    constructor(@InjectModel(Group.name) private readonly groupModel: Model<Group>) { }

    async getGroups(cursor: string, search: string) {
        let limit = 10
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};

        // const query = search
        //     ? { handle: { $regex: search, $options: 'i' }, ..._cursor }
        //     : _cursor;
        try {

            const query: any = search
                ?
                { $or: [{ handle: { $regex: search, $options: 'i' } }], ..._cursor }
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


            const groups = await this.groupModel.aggregate([
                { $match: query },
                { $sort: { createdAt: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user"
                    }
                }
            ])

            const hasNextPage = groups.length > limit
            const _groups = hasNextPage ? groups.slice(0, -1) : groups
            const nextCursor = hasNextPage ? _groups[_groups.length - 1].createdAt.toISOString() : null

            const results = { groups: _groups, nextCursor };
            return results
        } catch (error) {
            return { groups: [], nextCursor: null }
        }

    }

    async getGroup(groupId: string) {
        let group = await this.groupModel.findById(groupId)
        return group
    }

    async deleteGroup(groupId: string) {
        let deletedGroup = await this.groupModel.findByIdAndDelete(groupId)
        return deletedGroup
    }
}
