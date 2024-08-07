import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatGroup } from 'src/schema/cgroup';

@Injectable()
export class CGroupService {
    constructor(@InjectModel(ChatGroup.name) private chatGroupModel: Model<ChatGroup>) { }

    async getChatGroups(cursor: string, search: string) {
        let limit = 10
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};

        const query = search
            ? { name: { $regex: search, $options: 'i' }, ..._cursor }
            : _cursor;

        const groups = await this.chatGroupModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit }
        ])

        const hasNextPage = groups.length > limit
        const _groups = hasNextPage ? groups.slice(0, -1) : groups
        const nextCursor = hasNextPage ? _groups[_groups.length - 1].createdAt.toISOString() : null

        const results = { chatgroups: groups, nextCursor };
        return results
    }
}
