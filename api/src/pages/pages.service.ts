import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Page } from 'src/schema/pages';
import { UserService } from 'src/user/user.service';
import { Types } from 'mongoose'
import { Follower } from 'src/schema/followers';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class PageService {
    constructor(
        @InjectModel(Page.name) private readonly pageModal: Model<Page>, 
        @InjectModel(Follower.name) private readonly followerModel: Model<Follower>,
        private readonly metricsAggregatorService: MetricsAggregatorService,
        private readonly notificationService: NotificationService,
    ) { }

    async getPage(handle, userId) {
        console.log(handle)
        const page = await this.pageModal.aggregate([
            { $match: { handle } },
            {
                $lookup: {
                    from: 'followers',
                    let: { pageId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$pageId'] },
                                        { $eq: ['$follower', new Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'followStatus',
                },
            },
            {
                $lookup: {
                    from: 'counters',
                    localField: "_id",
                    foreignField: "targetId",
                    as: 'followersCount'
                }
            },

            {
                $addFields: {
                    isFollower: { $gt: [{ $size: '$followStatus' }, 0] },
                    followersCount: {
                        $ifNull: [
                            { $arrayElemAt: ["$followersCount.count", 0] },
                            0
                        ]
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    handle: 1,
                    profile: 1,
                    cover: 1,
                    followersCount: 1,
                    admins: 1,
                    about: 1,
                    isFollower: 1,
                },
            },
        ]);
        return page[0]
    }

    async handleExists(handle: string) {
        const page = await this.pageModal.findOne({ handle })
        if (page && page.handle !== handle) {
            return false
        }
        return true
    }

    async toggleFollow(userId, pageDetails) {
        const filter = {
            follower: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(pageDetails.pageId),
            type: "page"
        };

        const deleteResult = await this.followerModel.deleteOne(filter);

        if (deleteResult.deletedCount === 0) {
            await this.followerModel.create(filter);
            await this.notificationService.createNotification(
                {
                    from: new Types.ObjectId(userId),
                    user: new Types.ObjectId(pageDetails.authorId),
                    targetId: new Types.ObjectId(pageDetails.pageId),
                    type: "page",
                    value: "has followed your page"
                }
            )
            await this.metricsAggregatorService.incrementCount(filter.targetId, "followers", "page")
            return {followStatus: true}
        }
        await this.metricsAggregatorService.decrementCount(filter.targetId, "followers", "page")
        return {followStatus: false};
    }

    async getRawPage(pageId: string) {
        return this.pageModal.findById(pageId)
    }


    async getPages(userId) {
        let pages = await this.pageModal.find({ user: userId }).sort({createdAt: -1})
        return pages
    }

    async createPage(userDetails, pageDetails: any) {
        console.log(pageDetails)
        let page = await this.pageModal.create({ admins: [userDetails.sub], user: userDetails.sub, ...pageDetails })
        return page
    }

    async updatePage(pageId: string, updatedDetails) {
        console.log("page being updated...")
        let _updatedDetails = await this.pageModal.findByIdAndUpdate(pageId, { $set: updatedDetails }, { new: true })
        return _updatedDetails
    }

    async deletePage(pageId: string) {
        let deletedPage = await this.pageModal.findByIdAndDelete(pageId)
        return deletedPage
    }
}
