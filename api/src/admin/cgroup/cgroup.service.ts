import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatGroup } from 'src/schema/cgroup';

@Injectable()
export class CGroupService {
    constructor(@InjectModel(ChatGroup.name) private chatGroupModel: Model<ChatGroup>) { }

    async getChatGroups(cursor: string, search: string) {
        let limit = 50
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        try {

            const query: any = search
                ?
                { $or: [{ _id: new Types.ObjectId(search) }, { user: new Types.ObjectId(search) }], ..._cursor }
                : _cursor;

            const groups = await this.chatGroupModel.aggregate([
                { $match: query },
                { $sort: { createdAt: -1 } },
                { $limit: limit + 1 },
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

            const results = { chatgroups: groups, nextCursor };
            return results
        } catch (error) {
            return { chatgroups: [], nextCursor: null }
        }
    }
}
