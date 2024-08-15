import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Page } from 'src/schema/pages';

@Injectable()
export class PageService {
    constructor(@InjectModel(Page.name) private pageModel: Model<Page>) { }

    async getPages(cursor: string, search: string) {
        let limit = 10
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};

        const query = search
            ? { username: { $regex: search, $options: 'i' }, ..._cursor }
            : _cursor;

        const pages = await this.pageModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    let: { userId: { $toObjectId: "$user" } },
                    pipeline: [
                      { $match: { $expr: { $eq: ["$_id", "$$userId"] } } }
                    ],
                    as: "user"
                }
            }
        ])

        const hasNextPage = pages.length > limit
        const _pages = hasNextPage ? pages.slice(0, -1) : pages
        const nextCursor = hasNextPage ? _pages[_pages.length - 1].createdAt.toISOString() : null

        const results = { pages: _pages, nextCursor };
        return results
    }
}
