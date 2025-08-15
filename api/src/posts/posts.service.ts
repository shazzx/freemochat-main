import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { FollowerService } from 'src/follower/follower.service';
import { LocationService } from 'src/location/location.service';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { NotificationService } from 'src/notification/notification.service';
import { PaymentService } from 'src/payment/payment.service';
import { Bookmark } from 'src/schema/bookmark';
import { Comment } from 'src/schema/comment';
import { Follower } from 'src/schema/followers';
import { Like } from 'src/schema/likes';
import { Member } from 'src/schema/members';
import { EnvironmentalContribution, Post } from 'src/schema/post';
import { Promotion } from 'src/schema/promotion';
import { Report } from 'src/schema/report';
import { CreateEnvironmentalContributionDTO, GetGlobalMapCountsDTO, GetGlobalMapDataDTO, SearchGlobalMapLocationsDTO, UpdateEnvironmentalContributionDTO } from 'src/schema/validation/post';
import { ViewedPosts } from 'src/schema/viewedPosts';
import { UploadService } from 'src/upload/upload.service';
import { UserService } from 'src/user/user.service';
import { CURRENCIES, PAYMENT_PROVIDERS, PAYMENT_STATES, POST_PROMOTION, ReachStatus } from 'src/utils/enums/global.c';
import { SBulkViewPost, SPostPromotion, SViewPost } from 'src/utils/types/service/posts';


@Injectable()
export class PostsService {
    constructor(
        @InjectModel(Post.name) private readonly postModel: Model<Post>,
        @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
        @InjectModel(Report.name) private readonly reportModel: Model<Report>,
        @InjectModel(Promotion.name) private readonly promotionModel: Model<Promotion>,
        @InjectModel(Like.name) private readonly likeModel: Model<Like>,
        @InjectModel(Bookmark.name) private readonly bookmarkModel: Model<Bookmark>,
        @InjectModel(ViewedPosts.name) private readonly viewPostsModel: Model<ViewedPosts>,
        @InjectModel(Follower.name) private readonly followerModel: Model<Follower>,
        @InjectModel(Member.name) private readonly memberModel: Model<Member>,
        @InjectModel(EnvironmentalContribution.name) private readonly environmentalContributionModel: Model<EnvironmentalContribution>,
        private uploadService: UploadService,
        private readonly notificationService: NotificationService,
        private readonly metricsAggregatorService: MetricsAggregatorService,
        private readonly userService: UserService,
        private readonly locationService: LocationService,
        private readonly paymentService: PaymentService,
        private readonly followersService: FollowerService,
    ) { }

    @Cron('0 9 * * *')
    async processPlantationManagement() {
        console.log('Processing plantation management: reminders and removals...');

        const today = new Date();

        try {
            // Step 1: Send reminders for upcoming due dates
            await this.processPlantationReminders(today);

            // Step 2: Remove plants that are 3+ days overdue
            await this.removeOverduePlantations(today);

            console.log('✅ Completed plantation management processing');
        } catch (error) {
            console.error('❌ Error in plantation management:', error);
        }
    }

    // async updatePosts() {
    //     // Replace this with your actual domains:
    //     const OLD_DOMAIN = "https://d2skidyn2qrzjz.cloudfront.net";
    //     const NEW_DOMAIN = "https://cdn.freemochat.com";

    //     // Update Posts collection
    //     const data = await this.postModel.updateMany(
    //         {
    //             $or: [
    //                 { "media.url": { $regex: "d2skidyn2qrzjz.cloudfront.net" } },
    //                 { "media.watermarkUrl": { $regex: "d2skidyn2qrzjz.cloudfront.net" } },
    //                 { "media.thumbnail": { $regex: "d2skidyn2qrzjz.cloudfront.net" } }
    //             ]
    //         },
    //         [
    //             {
    //                 $set: {
    //                     media: {
    //                         $map: {
    //                             input: "$media",
    //                             as: "mediaItem",
    //                             in: {
    //                                 $mergeObjects: [
    //                                     "$$mediaItem",
    //                                     {
    //                                         url: {
    //                                             $cond: {
    //                                                 if: { $ne: ["$$mediaItem.url", null] },
    //                                                 then: {
    //                                                     $replaceAll: {
    //                                                         input: "$$mediaItem.url",
    //                                                         find: OLD_DOMAIN,
    //                                                         replacement: NEW_DOMAIN
    //                                                     }
    //                                                 },
    //                                                 else: "$$mediaItem.url"
    //                                             }
    //                                         },
    //                                         watermarkUrl: {
    //                                             $cond: {
    //                                                 if: { $ne: ["$$mediaItem.watermarkUrl", null] },
    //                                                 then: {
    //                                                     $replaceAll: {
    //                                                         input: "$$mediaItem.watermarkUrl",
    //                                                         find: OLD_DOMAIN,
    //                                                         replacement: NEW_DOMAIN
    //                                                     }
    //                                                 },
    //                                                 else: "$$mediaItem.watermarkUrl"
    //                                             }
    //                                         },
    //                                         thumbnail: {
    //                                             $cond: {
    //                                                 if: { $ne: ["$$mediaItem.thumbnail", null] },
    //                                                 then: {
    //                                                     $replaceAll: {
    //                                                         input: "$$mediaItem.thumbnail",
    //                                                         find: OLD_DOMAIN,
    //                                                         replacement: NEW_DOMAIN
    //                                                     }
    //                                                 },
    //                                                 else: "$$mediaItem.thumbnail"
    //                                             }
    //                                         }
    //                                     }
    //                                 ]
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         ]
    //     );

    //     console.log(data, 'response')
    //     return data
    // }

    private async processPlantationReminders(today: Date) {

        const notificationStages = [
            { stage: '1_month', daysBefore: 30 },
            { stage: '15_days', daysBefore: 15 },
            { stage: '7_days', daysBefore: 7 },
            { stage: '3_days', daysBefore: 3 },
            { stage: '24_hours', daysBefore: 1 }
        ];

        for (const stage of notificationStages) {
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + stage.daysBefore);

            const plantationsDue = await this.getPlantationsDue(targetDate, stage);

            if (plantationsDue.length > 0) {
                console.log(`Found ${plantationsDue.length} plantations for ${stage.stage} notification`);

                // Group and send consolidated notifications
                const groupedPlantations = this.groupPlantationsByUserAndProject(plantationsDue);
                console.log(`Grouped into ${Object.keys(groupedPlantations).length} consolidated notifications`);

                for (const [groupKey, plantations] of Object.entries(groupedPlantations)) {
                    await this.sendGroupedPlantationReminder(plantations, stage);
                }
            }
        }
    }

    private async removeOverduePlantations(today: Date) {
        console.log('Checking for plants to remove (3+ days overdue)...');

        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        threeDaysAgo.setHours(23, 59, 59, 999);

        try {
            const overduePlantations = await this.environmentalContributionModel.aggregate([
                {
                    $match: {
                        'plantationData.nextUpdateDue': { $lt: threeDaysAgo },
                        plantationData: { $exists: true }
                    }
                },
                {
                    $lookup: {
                        from: 'posts',
                        localField: 'postId',
                        foreignField: '_id',
                        as: 'post'
                    }
                },
                { $unwind: '$post' },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'post.user',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $match: {
                        'post.postType': 'plantation'
                    }
                }
            ]);

            console.log(`Found ${overduePlantations.length} plantations to remove (3+ days overdue)`);

            if (overduePlantations.length === 0) {
                return;
            }

            // Group by user and project for consolidated removal notifications
            const groupedRemovals = this.groupPlantationsByUserAndProject(overduePlantations);

            for (const [groupKey, plantations] of Object.entries(groupedRemovals)) {
                const plantationIds = plantations.map(p => p._id);

                const deleteResult = await this.environmentalContributionModel.deleteMany(
                    { _id: { $in: plantationIds } }
                );

                console.log(`🗑️ Deleted ${deleteResult.deletedCount} plantations from database`);

                const user = plantations[0].user;
                const project = plantations[0].post;
                const plantCount = plantations.length;
                const plantSummary = this.createPlantSummary(plantations);

                const plantText = plantCount === 1 ?
                    `Your ${plantSummary}` :
                    `Your ${plantCount} plants${plantSummary ? ` (${plantSummary})` : ''}`;

                await this.notificationService.createNotification({
                    from: null,
                    user: user._id,
                    targetId: new Types.ObjectId(project._id),
                    type: 'system',
                    postType: 'plantation_removed',
                    targetType: 'project',
                    value: `❌ ${plantText} in "${project.projectDetails?.name}" ${plantCount === 1 ? 'has' : 'have'} been permanently removed from the system (3+ days overdue). You can add ${plantCount === 1 ? 'it' : 'them'} back by creating new plantation entries.`,
                });

                console.log(`✅ Removed and notified about ${plantations.length} plantations from project ${project._id}`);
            }

            console.log(`✅ Total removed: ${overduePlantations.length} plantations from ${Object.keys(groupedRemovals).length} projects`);

        } catch (error) {
            console.error('❌ Error removing overdue plantations:', error);
        }
    }

    private groupPlantationsByUserAndProject(plantations: any[]): Record<string, any[]> {
        const grouped: Record<string, any[]> = {};

        for (const plantation of plantations) {
            const groupKey = `${plantation.user._id}_${plantation.post._id}`;

            if (!grouped[groupKey]) {
                grouped[groupKey] = [];
            }

            grouped[groupKey].push(plantation);
        }

        return grouped;
    }

    private async getPlantationsDue(targetDate: Date, stage: any) {
        try {
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            // FIXED: Removed isActive and notificationStages references
            const query = {
                'plantationData.nextUpdateDue': {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                plantationData: { $exists: true }
            };

            const plantations = await this.environmentalContributionModel.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'posts',
                        localField: 'postId',
                        foreignField: '_id',
                        as: 'post'
                    }
                },
                { $unwind: '$post' },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'post.user',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $match: {
                        'post.postType': 'plantation'
                    }
                }
            ]);

            // SIMPLE DUPLICATE PREVENTION: Check if we sent notification today
            const today = new Date();
            const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

            // Filter out plantations that might have been notified today
            // Since we don't have notificationStages field, we use a simple daily check
            const filteredPlantations = plantations.filter(plantation => {
                const lastUpdate = plantation.plantationData.lastUpdateDate;
                if (!lastUpdate) return true; // Never updated, needs reminder

                const lastUpdateDate = new Date(lastUpdate).toISOString().split('T')[0];
                // If updated today, no need for reminder
                return lastUpdateDate !== todayString;
            });

            return filteredPlantations;

        } catch (error) {
            console.error('Error fetching plantations due:', error);
            return [];
        }
    }

    async sendGroupedPlantationReminder(plantations: any[], stage: any) {
        try {
            if (plantations.length === 0) return;

            const firstPlantation = plantations[0];
            const user = firstPlantation.user;
            const project = firstPlantation.post;

            const today = new Date();
            const dueDate = new Date(firstPlantation.plantationData.nextUpdateDue);
            const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Create consolidated message
            const message = this.createGroupedReminderMessage(plantations, project, stage, daysRemaining);

            console.log(`Sending grouped plantation reminder:`, {
                userId: user._id,
                projectId: project._id,
                plantCount: plantations.length,
                stage: stage.stage
            });

            // Send single consolidated notification
            await this.notificationService.createNotification({
                from: null,
                user: new Types.ObjectId(user._id),
                targetId: new Types.ObjectId(project._id),
                type: 'system',
                postType: 'plantation_reminder',
                targetType: 'project',
                value: message,
            });

            // REMOVED: notificationStages update since field doesn't exist in schema
            console.log(`✅ Sent grouped ${stage.stage} reminder for ${plantations.length} plantations`);

        } catch (error) {
            console.error(`❌ Failed to send grouped reminder:`, error);
        }
    }

    private createGroupedReminderMessage(plantations: any[], project: any, stage: any, daysRemaining: number): string {
        const projectName = project.projectDetails?.name || 'your plantation project';
        const plantCount = plantations.length;
        const plantSummary = this.createPlantSummary(plantations);

        const plantText = plantCount === 1 ?
            `your ${plantSummary}` :
            `your ${plantCount} plants${plantSummary ? ` (${plantSummary})` : ''}`;

        // Messages with 3-day removal warning
        switch (stage.stage) {
            case '1_month':
                return `Reminder: ${plantText}(plant) in "${projectName}"
                (project) need${plantCount === 1 ? 's' : ''} an update in 1 month. ${plantCount === 1 ? 'It' : 'They'} will be permanently removed 3 days after the due date.`;

            case '15_days':
                return `Reminder: ${plantText}(plant) in "${projectName}"
                (project) need${plantCount === 1 ? 's' : ''} an update in 15 days. ${plantCount === 1 ? 'It' : 'They'} will be permanently removed 3 days after the due date.`;

            case '7_days':
                return `Urgent: ${plantText}(plant) in "${projectName}"
                (project) need${plantCount === 1 ? 's' : ''} an update in 7 days. ${plantCount === 1 ? 'It' : 'They'} will be permanently removed 3 days after the due date.`;

            case '3_days':
                return `Critical: ${plantText}(plant) in "${projectName}"
                (project) need${plantCount === 1 ? 's' : ''} an update in 3 days. ${plantCount === 1 ? 'It' : 'They'} will be permanently removed 3 days after the due date.`;

            case '24_hours':
                return `Final Notice: ${plantText}(plant) in "${projectName}"
                (project) need${plantCount === 1 ? 's' : ''} an update tomorrow. ${plantCount === 1 ? 'It' : 'They'} will be permanently removed 3 days after the due date.`;

            default:
                return `Reminder: ${plantText}(plant) in "${projectName}"
                (project) need${plantCount === 1 ? 's' : ''} an update in ${daysRemaining} days. ${plantCount === 1 ? 'It' : 'They'} will be permanently removed 3 days after the due date.`;
        }
    }

    private createPlantSummary(plantations: any[]): string {
        const plantTypes = new Map<string, number>();

        for (const plantation of plantations) {
            const plantData = plantation.plantationData;
            const key = plantData?.species || plantData?.type || 'plant';
            plantTypes.set(key, (plantTypes.get(key) || 0) + 1);
        }

        const entries = Array.from(plantTypes.entries());

        if (entries.length === 1) {
            const [type, count] = entries[0];
            return count > 1 ? `${count} ${type}s` : type;
        } else if (entries.length === 2) {
            return entries.map(([type, count]) => count > 1 ? `${count} ${type}s` : type).join(' and ');
        } else if (entries.length <= 4) {
            const last = entries.pop()!;
            const others = entries.map(([type, count]) => count > 1 ? `${count} ${type}s` : type);
            return `${others.join(', ')}, and ${last[1] > 1 ? `${last[1]} ${last[0]}s` : last[0]}`;
        } else {
            return `including ${entries.slice(0, 2).map(([type]) => type).join(', ')} and ${entries.length - 2} other types`;
        }
    }

    async getPosts(cursor: string | null, userId: string, targetId: string, type: string, self: string) {
        let model = type + 's'
        const limit = 12

        let visibility = {
            $or: [
                { visibility: 'public' },
                { $and: [{ visibility: 'private' }, { user: new Types.ObjectId(userId) }] }
            ]
        }

        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) }, ...visibility } : { ...visibility };

        let query = targetId ? {
            ..._cursor,
            targetId: new Types.ObjectId(targetId),
            type,
            postType: { $in: ['post', 'plantation', 'garbage_collection', 'water_ponds', 'rain_water'] }
        } : {
            ..._cursor,
            type,
            postType: { $in: ['post', 'plantation', 'garbage_collection', 'water_ponds', 'rain_water'] }
        }

        const posts = await this.postModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: model,
                    localField: "targetId",
                    foreignField: "_id",
                    as: "target"
                }
            },
            {
                $addFields: {
                    userObjectId: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $eq: [{ $type: "$user" }, "string"] },
                                    then: { $toObjectId: "$user" },
                                    else: "$user"
                                }
                            },
                            else: null
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userObjectId", postType: "$type" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$postType", "group"] },
                                        { $eq: ["$_id", "$$userId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "userDetails"
                }
            },
            {
                $addFields: {
                    user: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $gt: [{ $size: "$userDetails" }, 0] },
                                    then: { $arrayElemAt: ["$userDetails", 0] },
                                    else: null
                                }
                            },
                            else: "$user"
                        }
                    }
                }
            },
            {
                $unwind: "$target"
            },
            // Environmental profile lookup for main target - ADD THIS NEW STAGE
            {
                $lookup: {
                    from: 'counters',
                    let: { targetId: '$targetId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$targetId'] },
                                        { $in: ['$name', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] },
                                        { $eq: ['$type', 'contributions'] }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                contributionTypes: { $addToSet: '$name' }
                            }
                        }
                    ],
                    as: 'targetEnvironmentalContributions'
                }
            },
            {
                $lookup: {
                    from: 'posts',
                    let: { sharedPostId: '$sharedPost' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ['$$sharedPostId', null] },
                                        { $eq: ['$_id', '$$sharedPostId'] }
                                    ]
                                }
                            }
                        },
                        // Target lookup for shared post
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
                        // Handle user for shared post
                        {
                            $addFields: {
                                userObjectId: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $eq: [{ $type: "$user" }, "string"] },
                                                then: { $toObjectId: "$user" },
                                                else: "$user"
                                            }
                                        },
                                        else: null
                                    }
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                let: { userId: "$userObjectId", postType: "$type" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$$postType", "group"] },
                                                    { $eq: ["$_id", "$$userId"] }
                                                ]
                                            }
                                        }
                                    },
                                    { $limit: 1 }
                                ],
                                as: "userDetails"
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'regularUserDetails'
                            }
                        },
                        {
                            $addFields: {
                                user: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$userDetails" }, 0] },
                                                then: { $arrayElemAt: ["$userDetails", 0] },
                                                else: null
                                            }
                                        },
                                        else: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                                then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                                else: "$user"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        // Handle likes for shared post
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
                        // Handle bookmarks for shared post
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
                            $lookup: {
                                from: 'environmentalcontributions',
                                let: { postId: '$_id', postType: '$postType' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$postId', '$$postId'] },
                                                    { $in: ['$$postType', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'environmentalContributions'
                            }
                        },
                        // Handle counters for shared post
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
                                                    { $in: ['$type', ['likes', 'comments', 'bookmarks', 'shares', 'videoViews']] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'counters'
                            }
                        },
                        // Environmental profile lookup for shared post target - ADD THIS NEW STAGE
                        {
                            $lookup: {
                                from: 'counters',
                                let: { targetId: '$targetId' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$targetId', '$$targetId'] },
                                                    { $in: ['$name', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] },
                                                    { $eq: ['$type', 'contributions'] }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: null,
                                            contributionTypes: { $addToSet: '$name' }
                                        }
                                    }
                                ],
                                as: 'targetEnvironmentalContributions'
                            }
                        },
                        // Combine fields for shared post - UPDATE THIS STAGE
                        {
                            $addFields: {
                                target: {
                                    $let: {
                                        vars: {
                                            targetObj: {
                                                $switch: {
                                                    branches: [
                                                        { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
                                                        { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
                                                        { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
                                                    ],
                                                    default: null
                                                }
                                            },
                                            envContributions: { $arrayElemAt: ['$targetEnvironmentalContributions.contributionTypes', 0] }
                                        },
                                        in: {
                                            $cond: {
                                                if: {
                                                    $and: [
                                                        { $ne: ['$$targetObj', null] },
                                                        { $ne: ['$$targetObj.type', 'group'] }
                                                    ]
                                                },
                                                then: {
                                                    $mergeObjects: [
                                                        '$$targetObj',
                                                        {
                                                            environmentalProfile: {
                                                                plantation: { $in: ['plantation', { $ifNull: ['$$envContributions', []] }] },
                                                                garbage_collection: { $in: ['garbage_collection', { $ifNull: ['$$envContributions', []] }] },
                                                                water_ponds: { $in: ['water_ponds', { $ifNull: ['$$envContributions', []] }] },
                                                                rain_water: { $in: ['rain_water', { $ifNull: ['$$envContributions', []] }] }
                                                            }
                                                        }
                                                    ]
                                                },
                                                else: '$$targetObj'
                                            }
                                        }
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
                                sharesCount: {
                                    $ifNull: [
                                        { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'shares'] } } }, 0] },
                                        0
                                    ]
                                },
                                videoViewsCount: {
                                    $ifNull: [
                                        { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'videoViews'] } } }, 0] },
                                        0
                                    ]
                                },
                                bookmarksCount: {
                                    $ifNull: [
                                        { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                                        0
                                    ]
                                },
                                isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                                reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                                isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'mentions',
                                foreignField: '_id',
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            username: 1,
                                            firstname: 1,
                                            lastname: 1,
                                            profile: 1
                                        }
                                    }
                                ],
                                as: 'mentions'
                            }
                        },
                        // Project shared post fields
                        {
                            $project: {
                                _id: 1,
                                content: 1,
                                media: 1,
                                user: 1,
                                promotion: 1,
                                location: 1,
                                projectDetails: 1,
                                environmentalContributions: 1,
                                isUploaded: 1,
                                target: 1,
                                reaction: 1,
                                mentions: 1,
                                hashtags: 1,
                                videoViewsCount: { $ifNull: ['$videoViewsCount.count', 0] },
                                likesCount: { $ifNull: ['$likesCount.count', 0] },
                                commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                                sharesCount: { $ifNull: ['$sharesCount.count', 0] },
                                bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                                isLikedByUser: 1,
                                targetId: 1,
                                postType: 1,
                                type: 1,
                                backgroundColor: 1,
                                isBookmarkedByUser: 1,
                                updatedAt: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    as: 'sharedPostDetails'
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
                $lookup: {
                    from: 'environmentalcontributions',
                    let: { postId: '$_id', postType: '$postType' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$postId', '$$postId'] },
                                        { $in: ['$$postType', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'environmentalContributions'
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
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks', 'shares', 'videoViews']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'counters'
                }
            },
            // UPDATE THIS STAGE - Add environmental profile to main target
            {
                $addFields: {
                    target: {
                        $let: {
                            vars: {
                                envContributions: { $arrayElemAt: ['$targetEnvironmentalContributions.contributionTypes', 0] }
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $and: [
                                            { $ne: ['$target', null] },
                                            { $ne: ['$target.type', 'group'] }
                                        ]
                                    },
                                    then: {
                                        $mergeObjects: [
                                            '$target',
                                            {
                                                environmentalProfile: {
                                                    plantation: { $in: ['plantation', { $ifNull: ['$$envContributions', []] }] },
                                                    garbage_collection: { $in: ['garbage_collection', { $ifNull: ['$$envContributions', []] }] },
                                                    water_ponds: { $in: ['water_ponds', { $ifNull: ['$$envContributions', []] }] },
                                                    rain_water: { $in: ['rain_water', { $ifNull: ['$$envContributions', []] }] }
                                                }
                                            }
                                        ]
                                    },
                                    else: '$target'
                                }
                            }
                        }
                    },
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                    likesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    commentsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    sharesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'shares'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    videoViewsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'videoViews'] } } }, 0] },
                            0
                        ]
                    },
                    bookmarksCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            { count: 0 }
                        ]
                    }
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                firstname: 1,
                                lastname: 1,
                                profile: 1
                            }
                        }
                    ],
                    as: 'mentions'
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    media: 1,
                    user: 1,
                    target: 1,
                    reaction: 1,
                    location: 1,
                    environmentalContributions: 1,
                    projectDetails: 1,
                    mentions: 1,
                    hashtags: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    videoViewsCount: { $ifNull: ['$videoViewsCount.count', 0] },
                    sharesCount: { $ifNull: ['$sharesCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    backgroundColor: 1,
                    postType: 1,
                    isBookmarkedByUser: 1,
                    updatedAt: 1,
                    createdAt: 1,
                    sharedPost: {
                        $cond: {
                            if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
                            then: { $arrayElemAt: ['$sharedPostDetails', 0] },
                            else: null
                        }
                    }
                },
            },
        ]);

        const hasNextPage = posts.length > limit;
        const _posts = hasNextPage ? posts.slice(0, -1) : posts;
        const nextCursor = hasNextPage ? _posts[_posts.length - 1].createdAt.toISOString() : null;

        const results = { posts: _posts, nextCursor };
        return results
        // let promotedPosts = await this.getPromotedPosts(userId, { country: string, city: string, area: string })
        // const results = { posts: [..._posts, ...promotedPosts], nextCursor };
        // this.cacheService.set(cacheKey, JSON.stringify(results), 300)
    }

    async getReels(cursor: string | null, userId: string, targetId: string, type: string) {
        let model = type + 's'
        const limit = 18

        // let visibility = self == 'true' ? {} : {}
        let visibility = {
            $or: [
                { visibility: 'public' },
                { $and: [{ visibility: 'private' }, { user: new Types.ObjectId(userId) }] }
            ]
        }

        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) }, ...visibility } : { ...visibility };
        let query = targetId ? { ..._cursor, targetId: new Types.ObjectId(targetId), postType: 'post', type, isUploaded: null, 'media.type': 'video' } : { ..._cursor, postType: 'post', type, 'media.type': 'video', isUploaded: null }

        const reels = await this.postModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: model,
                    localField: "targetId",
                    foreignField: "_id",
                    as: "target"
                }
            },
            {
                $addFields: {
                    userObjectId: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $eq: [{ $type: "$user" }, "string"] },
                                    then: { $toObjectId: "$user" },
                                    else: "$user"
                                }
                            },
                            else: null
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userObjectId", postType: "$type" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$postType", "group"] },
                                        { $eq: ["$_id", "$$userId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "userDetails"
                }
            },
            {
                $addFields: {
                    user: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $gt: [{ $size: "$userDetails" }, 0] },
                                    then: { $arrayElemAt: ["$userDetails", 0] },
                                    else: null
                                }
                            },
                            else: "$user"
                        }
                    }
                }
            },
            {
                $unwind: "$target"
            },
            {
                $lookup: {
                    from: 'posts',
                    let: { sharedPostId: '$sharedPost' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ['$$sharedPostId', null] },
                                        { $eq: ['$_id', '$$sharedPostId'] }
                                    ]
                                }
                            }
                        },
                        // Target lookup for shared post
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
                        // Handle user for shared post
                        {
                            $addFields: {
                                userObjectId: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $eq: [{ $type: "$user" }, "string"] },
                                                then: { $toObjectId: "$user" },
                                                else: "$user"
                                            }
                                        },
                                        else: null
                                    }
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                let: { userId: "$userObjectId", postType: "$type" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$$postType", "group"] },
                                                    { $eq: ["$_id", "$$userId"] }
                                                ]
                                            }
                                        }
                                    },
                                    { $limit: 1 }
                                ],
                                as: "userDetails"
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'regularUserDetails'
                            }
                        },
                        {
                            $addFields: {
                                user: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$userDetails" }, 0] },
                                                then: { $arrayElemAt: ["$userDetails", 0] },
                                                else: null
                                            }
                                        },
                                        else: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                                then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                                else: "$user"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        // Handle likes for shared post
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
                        // Handle bookmarks for shared post
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
                        // Handle counters for shared post
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
                                                    { $in: ['$type', ['likes', 'comments', 'bookmarks',]] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'counters'
                            }
                        },
                        // Combine fields for shared post
                        {
                            $addFields: {
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
                                isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                                reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                                isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'mentions',
                                foreignField: '_id',
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            username: 1,
                                            firstname: 1,
                                            lastname: 1,
                                            profile: 1
                                        }
                                    }
                                ],
                                as: 'mentions'
                            }
                        },
                        // Project shared post fields
                        {
                            $project: {
                                _id: 1,
                                content: 1,
                                media: 1,
                                user: 1,
                                promotion: 1,
                                isUploaded: 1,
                                target: 1,
                                reaction: 1,
                                mentions: 1,
                                hashtags: 1,
                                videoViewsCount: { $ifNull: ['$videoViewsCount.count', 0] },
                                likesCount: { $ifNull: ['$likesCount.count', 0] },
                                commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                                bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                                isLikedByUser: 1,
                                targetId: 1,
                                type: 1,
                                isBookmarkedByUser: 1,
                                updatedAt: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    as: 'sharedPostDetails'
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
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks', 'videoViews', 'shares']] }
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
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                    likesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    commentsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    videoViewsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'videoViews'] } } }, 0] },
                            0
                        ]
                    },
                    sharesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'shares'] } } }, 0] },
                            0
                        ]
                    },
                    bookmarksCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            { count: 0 }
                        ]
                    }
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                firstname: 1,
                                lastname: 1,
                                profile: 1
                            }
                        }
                    ],
                    as: 'mentions'
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    media: 1,
                    user: 1,
                    target: 1,
                    reaction: 1,
                    mentions: 1,
                    hashtags: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    videoViewsCount: { $ifNull: ['$videoViewsCount.count', 0] },
                    sharesCount: { $ifNull: ['$sharesCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    postType: 1,
                    isBookmarkedByUser: 1,
                    updatedAt: 1,
                    createdAt: 1,
                    sharedPost: {
                        $cond: {
                            if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
                            then: { $arrayElemAt: ['$sharedPostDetails', 0] },
                            else: null
                        }
                    }
                },
            },
        ]);

        const hasNextPage = reels.length > limit;
        const _reels = hasNextPage ? reels.slice(0, -1) : reels;
        const nextCursor = hasNextPage ? _reels[_reels.length - 1].createdAt.toISOString() : null;

        const results = { posts: _reels, nextCursor };
        return results
    }

    async getPostLikes(cursor, postId) {
        const limit = 12
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        let query = { ..._cursor, targetId: new Types.ObjectId(postId) }

        const likedBy = await this.likeModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userArray'
                }
            },
            {
                $addFields: {
                    user: {
                        $arrayElemAt: ['$userArray', 0]
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    type: 1,
                    reaction: 1,
                    targetId: 1,
                    user: {
                        username: '$user.username',
                        firstname: '$user.firstname',
                        lastname: '$user.lastname',
                        profile: '$user.profile',
                    },
                }
            }
        ])


        const hasNextPage = likedBy.length > limit;
        const _likedBy = hasNextPage ? likedBy.slice(0, -1) : likedBy;
        const nextCursor = hasNextPage ? _likedBy[_likedBy.length - 1].createdAt.toISOString() : null;

        const results = { likedBy: _likedBy, nextCursor };
        return results
    }

    async getPost(userId: string, postId: string, type: string) {
        const limit = 5
        let query = { _id: new Types.ObjectId(postId) }

        const post = await this.postModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
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
                $addFields: {
                    userObjectId: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $eq: [{ $type: "$user" }, "string"] },
                                    then: { $toObjectId: "$user" },
                                    else: "$user"
                                }
                            },
                            else: null
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'posts',
                    let: { sharedPostId: '$sharedPost' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ['$$sharedPostId', null] },
                                        { $eq: ['$_id', '$$sharedPostId'] }
                                    ]
                                }
                            }
                        },
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
                            $addFields: {
                                userObjectId: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $eq: [{ $type: "$user" }, "string"] },
                                                then: { $toObjectId: "$user" },
                                                else: "$user"
                                            }
                                        },
                                        else: null
                                    }
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                let: { userId: "$userObjectId", postType: "$type" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$$postType", "group"] },
                                                    { $eq: ["$_id", "$$userId"] }
                                                ]
                                            }
                                        }
                                    },
                                    { $limit: 1 }
                                ],
                                as: "userDetails"
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'regularUserDetails'
                            }
                        },
                        {
                            $addFields: {
                                user: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$userDetails" }, 0] },
                                                then: { $arrayElemAt: ["$userDetails", 0] },
                                                else: null
                                            }
                                        },
                                        else: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                                then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                                else: "$user"
                                            }
                                        }
                                    }
                                }
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
                                                    { $in: ['$type', ['likes', 'comments', 'bookmarks', 'shares', 'videoViews']] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'counters'
                            }
                        },
                        // Environmental profile lookup for shared post target - NEW STAGE
                        {
                            $lookup: {
                                from: 'counters',
                                let: { targetId: '$targetId' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$targetId', '$$targetId'] },
                                                    { $in: ['$name', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] },
                                                    { $eq: ['$type', 'contributions'] }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: null,
                                            contributionTypes: { $addToSet: '$name' }
                                        }
                                    }
                                ],
                                as: 'targetEnvironmentalContributions'
                            }
                        },
                        // Environmental contributions lookup for shared post - NEW STAGE
                        {
                            $lookup: {
                                from: 'environmentalcontributions',
                                let: { postId: '$_id', postType: '$postType' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$postId', '$$postId'] },
                                                    { $in: ['$$postType', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'environmentalContributions'
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'mentions',
                                foreignField: '_id',
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            username: 1,
                                            firstname: 1,
                                            lastname: 1,
                                            profile: 1
                                        }
                                    }
                                ],
                                as: 'mentions'
                            }
                        },
                        // UPDATED - Enhanced target field with environmental profile
                        {
                            $addFields: {
                                target: {
                                    $let: {
                                        vars: {
                                            targetObj: {
                                                $switch: {
                                                    branches: [
                                                        { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
                                                        { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
                                                        { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
                                                    ],
                                                    default: null
                                                }
                                            },
                                            envContributions: { $arrayElemAt: ['$targetEnvironmentalContributions.contributionTypes', 0] }
                                        },
                                        in: {
                                            $cond: {
                                                if: {
                                                    $and: [
                                                        { $ne: ['$$targetObj', null] },
                                                        { $ne: ['$$targetObj.type', 'group'] }
                                                    ]
                                                },
                                                then: {
                                                    $mergeObjects: [
                                                        '$$targetObj',
                                                        {
                                                            environmentalProfile: {
                                                                plantation: { $in: ['plantation', { $ifNull: ['$$envContributions', []] }] },
                                                                garbage_collection: { $in: ['garbage_collection', { $ifNull: ['$$envContributions', []] }] },
                                                                water_ponds: { $in: ['water_ponds', { $ifNull: ['$$envContributions', []] }] },
                                                                rain_water: { $in: ['rain_water', { $ifNull: ['$$envContributions', []] }] }
                                                            }
                                                        }
                                                    ]
                                                },
                                                else: '$$targetObj'
                                            }
                                        }
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
                                sharesCount: {
                                    $ifNull: [
                                        { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'shares'] } } }, 0] },
                                        0
                                    ]
                                },
                                bookmarksCount: {
                                    $ifNull: [
                                        { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                                        0
                                    ]
                                },
                                videoViewsCount: {
                                    $ifNull: [
                                        { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'videoViews'] } } }, 0] },
                                        0
                                    ]
                                },
                                isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                                reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                                isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                            }
                        },
                        // UPDATED - Added missing fields to projection
                        {
                            $project: {
                                _id: 1,
                                content: 1,
                                media: 1,
                                user: 1,
                                promotion: 1,
                                isUploaded: 1,
                                target: 1,
                                location: 1,
                                projectDetails: 1,
                                environmentalContributions: 1,
                                reaction: 1,
                                mentions: 1,
                                hashtags: 1,
                                likesCount: { $ifNull: ['$likesCount.count', 0] },
                                commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                                sharesCount: { $ifNull: ['$sharesCount.count', 0] },
                                videoViewsCount: { $ifNull: ['$videoViewsCount.count', 0] },
                                bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                                isLikedByUser: 1,
                                targetId: 1,
                                type: 1,
                                backgroundColor: 1,
                                postType: 1,
                                isBookmarkedByUser: 1,
                                updatedAt: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    as: 'sharedPostDetails'
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userObjectId", postType: "$type" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$postType", "group"] },
                                        { $eq: ["$_id", "$$userId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "userDetails"
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'regularUserDetails'
                }
            },
            {
                $addFields: {
                    user: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $gt: [{ $size: "$userDetails" }, 0] },
                                    then: { $arrayElemAt: ["$userDetails", 0] },
                                    else: null
                                }
                            },
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                    then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                    else: "$user"
                                }
                            }
                        }
                    }
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
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks', 'shares', 'videoViews']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'counters'
                }
            },
            // Environmental profile lookup for main post target - NEW STAGE
            {
                $lookup: {
                    from: 'counters',
                    let: { targetId: '$targetId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$targetId'] },
                                        { $in: ['$name', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] },
                                        { $eq: ['$type', 'contributions'] }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                contributionTypes: { $addToSet: '$name' }
                            }
                        }
                    ],
                    as: 'targetEnvironmentalContributions'
                }
            },
            // Environmental contributions lookup for main post - NEW STAGE
            {
                $lookup: {
                    from: 'environmentalcontributions',
                    let: { postId: '$_id', postType: '$postType' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$postId', '$$postId'] },
                                        { $in: ['$$postType', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                location: 1,
                                plantationData: 1,
                                garbageCollectionData: 1,
                                waterPondsData: 1,
                                rainWaterData: 1,
                                media: 1,
                                updateHistory: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    as: 'environmentalContributions'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                firstname: 1,
                                lastname: 1,
                                profile: 1
                            }
                        }
                    ],
                    as: 'mentions'
                }
            },
            // UPDATED - Enhanced target field with environmental profile
            {
                $addFields: {
                    target: {
                        $let: {
                            vars: {
                                targetObj: {
                                    $switch: {
                                        branches: [
                                            { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
                                            { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
                                            { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
                                        ],
                                        default: null
                                    }
                                },
                                envContributions: { $arrayElemAt: ['$targetEnvironmentalContributions.contributionTypes', 0] }
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $and: [
                                            { $ne: ['$$targetObj', null] },
                                            { $ne: ['$$targetObj.type', 'group'] }
                                        ]
                                    },
                                    then: {
                                        $mergeObjects: [
                                            '$$targetObj',
                                            {
                                                environmentalProfile: {
                                                    plantation: { $in: ['plantation', { $ifNull: ['$$envContributions', []] }] },
                                                    garbage_collection: { $in: ['garbage_collection', { $ifNull: ['$$envContributions', []] }] },
                                                    water_ponds: { $in: ['water_ponds', { $ifNull: ['$$envContributions', []] }] },
                                                    rain_water: { $in: ['rain_water', { $ifNull: ['$$envContributions', []] }] }
                                                }
                                            }
                                        ]
                                    },
                                    else: '$$targetObj'
                                }
                            }
                        }
                    },
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                    likesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    commentsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    sharesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'shares'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    bookmarksCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    videoViewsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'videoViews'] } } }, 0] },
                            { count: 0 }
                        ]
                    }
                },
            },
            // UPDATED - Added missing fields to projection
            {
                $project: {
                    _id: 1,
                    content: 1,
                    media: 1,
                    user: 1,
                    promotion: 1,
                    isUploaded: 1,
                    target: 1,
                    location: 1,
                    projectDetails: 1,
                    environmentalContributions: 1,
                    reaction: 1,
                    mentions: 1,
                    hashtags: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    sharesCount: { $ifNull: ['$sharesCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    videoViewsCount: { $ifNull: ['$videoViewsCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    backgroundColor: 1,
                    postType: 1,
                    isBookmarkedByUser: 1,
                    updatedAt: 1,
                    createdAt: 1,
                    sharedPost: {
                        $cond: {
                            if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
                            then: { $arrayElemAt: ['$sharedPostDetails', 0] },
                            else: null
                        }
                    }
                },
            },
        ]);

        return post
    }

    // async feed(userId, cursor) {
    //     const limit = 12

    //     let visibility = {
    //         $or: [
    //             { visibility: 'public' },
    //             { $and: [{ visibility: 'private' }, { user: new Types.ObjectId(userId) }] }
    //         ]
    //     }

    //     // const query = cursor ? { createdAt: { $lt: new Date(cursor) }, ...visibility, postType: 'post' } : { ...visibility, postType: 'post' };
    //     const query = cursor
    //         ? {
    //             createdAt: { $lt: new Date(cursor) },
    //             ...visibility,
    //             postType: { $in: ['post'] }
    //         }
    //         : {
    //             ...visibility,
    //             postType: { $in: ['post'] }
    //         };


    //     const posts = await this.postModel.aggregate([
    //         { $match: query },
    //         { $sort: { createdAt: -1 } },
    //         { $limit: limit + 1 },
    //         // Target lookup section - Look up possible targets from different collections
    //         {
    //             $lookup: {
    //                 from: 'users',
    //                 localField: 'targetId',
    //                 foreignField: '_id',
    //                 as: 'userTarget'
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: 'groups',
    //                 localField: 'targetId',
    //                 foreignField: '_id',
    //                 as: 'groupTarget'
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: 'pages',
    //                 localField: 'targetId',
    //                 foreignField: '_id',
    //                 as: 'pageTarget'
    //             }
    //         },
    //         // Handle user object ID conversion for group posts
    //         {
    //             $addFields: {
    //                 userObjectId: {
    //                     $cond: {
    //                         if: { $eq: ["$type", "group"] },
    //                         then: {
    //                             $cond: {
    //                                 if: { $eq: [{ $type: "$user" }, "string"] },
    //                                 then: { $toObjectId: "$user" },
    //                                 else: "$user"
    //                             }
    //                         },
    //                         else: null
    //                     }
    //                 }
    //             }
    //         },
    //         // Shared post lookup with enhanced structure to match main post
    //         {
    //             $lookup: {
    //                 from: 'posts',
    //                 let: { sharedPostId: '$sharedPost' },
    //                 pipeline: [
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $and: [
    //                                     { $ne: ['$$sharedPostId', null] },
    //                                     { $eq: ['$_id', '$$sharedPostId'] }
    //                                 ]
    //                             }
    //                         }
    //                     },
    //                     // Target lookup for shared post
    //                     {
    //                         $lookup: {
    //                             from: 'users',
    //                             localField: 'targetId',
    //                             foreignField: '_id',
    //                             as: 'userTarget'
    //                         }
    //                     },
    //                     {
    //                         $lookup: {
    //                             from: 'groups',
    //                             localField: 'targetId',
    //                             foreignField: '_id',
    //                             as: 'groupTarget'
    //                         }
    //                     },
    //                     {
    //                         $lookup: {
    //                             from: 'pages',
    //                             localField: 'targetId',
    //                             foreignField: '_id',
    //                             as: 'pageTarget'
    //                         }
    //                     },
    //                     // Handle user for shared post
    //                     {
    //                         $addFields: {
    //                             userObjectId: {
    //                                 $cond: {
    //                                     if: { $eq: ["$type", "group"] },
    //                                     then: {
    //                                         $cond: {
    //                                             if: { $eq: [{ $type: "$user" }, "string"] },
    //                                             then: { $toObjectId: "$user" },
    //                                             else: "$user"
    //                                         }
    //                                     },
    //                                     else: null
    //                                 }
    //                             }
    //                         }
    //                     },
    //                     {
    //                         $lookup: {
    //                             from: "users",
    //                             let: { userId: "$userObjectId", postType: "$type" },
    //                             pipeline: [
    //                                 {
    //                                     $match: {
    //                                         $expr: {
    //                                             $and: [
    //                                                 { $eq: ["$$postType", "group"] },
    //                                                 { $eq: ["$_id", "$$userId"] }
    //                                             ]
    //                                         }
    //                                     }
    //                                 },
    //                                 { $limit: 1 }
    //                             ],
    //                             as: "userDetails"
    //                         }
    //                     },
    //                     {
    //                         $lookup: {
    //                             from: 'users',
    //                             localField: 'user',
    //                             foreignField: '_id',
    //                             as: 'regularUserDetails'
    //                         }
    //                     },
    //                     {
    //                         $addFields: {
    //                             user: {
    //                                 $cond: {
    //                                     if: { $eq: ["$type", "group"] },
    //                                     then: {
    //                                         $cond: {
    //                                             if: { $gt: [{ $size: "$userDetails" }, 0] },
    //                                             then: { $arrayElemAt: ["$userDetails", 0] },
    //                                             else: null
    //                                         }
    //                                     },
    //                                     else: {
    //                                         $cond: {
    //                                             if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
    //                                             then: { $arrayElemAt: ["$regularUserDetails", 0] },
    //                                             else: "$user"
    //                                         }
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                     },
    //                     // Handle likes for shared post
    //                     {
    //                         $lookup: {
    //                             from: 'likes',
    //                             let: { postId: '$_id' },
    //                             pipeline: [
    //                                 {
    //                                     $match: {
    //                                         $expr: {
    //                                             $and: [
    //                                                 { $eq: ['$targetId', '$$postId'] },
    //                                                 { $eq: ['$userId', new Types.ObjectId(userId)] },
    //                                                 { $eq: ['$type', "post"] },
    //                                             ],
    //                                         },
    //                                     },
    //                                 },
    //                             ],
    //                             as: 'userLike',
    //                         },
    //                     },
    //                     // Handle bookmarks for shared post
    //                     {
    //                         $lookup: {
    //                             from: 'bookmarks',
    //                             let: { postId: '$_id' },
    //                             pipeline: [
    //                                 {
    //                                     $match: {
    //                                         $expr: {
    //                                             $and: [
    //                                                 { $eq: ['$postId', '$$postId'] },
    //                                                 { $eq: ['$userId', new Types.ObjectId(userId)] },
    //                                             ],
    //                                         },
    //                                     },
    //                                 },
    //                             ],
    //                             as: 'userBookmark',
    //                         },
    //                     },
    //                     // Handle counters for shared post
    //                     {
    //                         $lookup: {
    //                             from: 'counters',
    //                             let: { postId: '$_id' },
    //                             pipeline: [
    //                                 {
    //                                     $match: {
    //                                         $expr: {
    //                                             $and: [
    //                                                 { $eq: ['$targetId', '$$postId'] },
    //                                                 { $eq: ['$name', 'post'] },
    //                                                 { $in: ['$type', ['likes', 'comments', 'bookmarks']] }
    //                                             ]
    //                                         }
    //                                     }
    //                                 }
    //                             ],
    //                             as: 'counters'
    //                         }
    //                     },
    //                     // Combine fields for shared post
    //                     {
    //                         $addFields: {
    //                             target: {
    //                                 $switch: {
    //                                     branches: [
    //                                         { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
    //                                         { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
    //                                         { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
    //                                     ],
    //                                     default: null
    //                                 }
    //                             },
    //                             likesCount: {
    //                                 $ifNull: [
    //                                     { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
    //                                     0
    //                                 ]
    //                             },
    //                             commentsCount: {
    //                                 $ifNull: [
    //                                     { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
    //                                     0
    //                                 ]
    //                             },
    //                             bookmarksCount: {
    //                                 $ifNull: [
    //                                     { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
    //                                     0
    //                                 ]
    //                             },
    //                             isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
    //                             reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
    //                             isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
    //                         }
    //                     },
    //                     // Project shared post fields
    //                     {
    //                         $project: {
    //                             _id: 1,
    //                             content: 1,
    //                             media: 1,
    //                             user: 1,
    //                             promotion: 1,
    //                             isUploaded: 1,
    //                             target: 1,
    //                             reaction: 1,
    //                             likesCount: { $ifNull: ['$likesCount.count', 0] },
    //                             commentsCount: { $ifNull: ['$commentsCount.count', 0] },
    //                             bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
    //                             isLikedByUser: 1,
    //                             targetId: 1,
    //                             type: 1,
    //                             isBookmarkedByUser: 1,
    //                             updatedAt: 1,
    //                             createdAt: 1
    //                         }
    //                     }
    //                 ],
    //                 as: 'sharedPostDetails'
    //             }
    //         },
    //         // User lookup for main post
    //         {
    //             $lookup: {
    //                 from: "users",
    //                 let: { userId: "$userObjectId", postType: "$type" },
    //                 pipeline: [
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $and: [
    //                                     { $eq: ["$$postType", "group"] },
    //                                     { $eq: ["$_id", "$$userId"] }
    //                                 ]
    //                             }
    //                         }
    //                     },
    //                     { $limit: 1 }
    //                 ],
    //                 as: "userDetails"
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: 'users',
    //                 localField: 'user',
    //                 foreignField: '_id',
    //                 as: 'regularUserDetails'
    //             }
    //         },
    //         {
    //             $addFields: {
    //                 user: {
    //                     $cond: {
    //                         if: { $eq: ["$type", "group"] },
    //                         then: {
    //                             $cond: {
    //                                 if: { $gt: [{ $size: "$userDetails" }, 0] },
    //                                 then: { $arrayElemAt: ["$userDetails", 0] },
    //                                 else: null
    //                             }
    //                         },
    //                         else: {
    //                             $cond: {
    //                                 if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
    //                                 then: { $arrayElemAt: ["$regularUserDetails", 0] },
    //                                 else: "$user"
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         },
    //         // Bookmark lookup for main post
    //         {
    //             $lookup: {
    //                 from: 'bookmarks',
    //                 let: { postId: '$_id' },
    //                 pipeline: [
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $and: [
    //                                     { $eq: ['$postId', '$$postId'] },
    //                                     { $eq: ['$userId', new Types.ObjectId(userId)] },
    //                                 ],
    //                             },
    //                         },
    //                     },
    //                 ],
    //                 as: 'userBookmark',
    //             },
    //         },
    //         // Like lookup for main post
    //         {
    //             $lookup: {
    //                 from: 'likes',
    //                 let: { postId: '$_id' },
    //                 pipeline: [
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $and: [
    //                                     { $eq: ['$targetId', '$$postId'] },
    //                                     { $eq: ['$userId', new Types.ObjectId(userId)] },
    //                                     { $eq: ['$type', "post"] },
    //                                 ],
    //                             },
    //                         },
    //                     },
    //                 ],
    //                 as: 'userLike',
    //             },
    //         },
    //         // Counter lookup for main post
    //         {
    //             $lookup: {
    //                 from: 'counters',
    //                 let: { postId: '$_id' },
    //                 pipeline: [
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $and: [
    //                                     { $eq: ['$targetId', '$$postId'] },
    //                                     { $eq: ['$name', 'post'] },
    //                                     { $in: ['$type', ['likes', 'comments', 'bookmarks']] }
    //                                 ]
    //                             }
    //                         }
    //                     }
    //                 ],
    //                 as: 'counters'
    //             }
    //         },
    //         // Combine fields for main post
    //         {
    //             $addFields: {
    //                 target: {
    //                     $switch: {
    //                         branches: [
    //                             { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
    //                             { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
    //                             { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
    //                         ],
    //                         default: null
    //                     }
    //                 },
    //                 likesCount: {
    //                     $ifNull: [
    //                         { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
    //                         0
    //                     ]
    //                 },
    //                 commentsCount: {
    //                     $ifNull: [
    //                         { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
    //                         0
    //                     ]
    //                 },
    //                 bookmarksCount: {
    //                     $ifNull: [
    //                         { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
    //                         0
    //                     ]
    //                 },
    //                 isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
    //                 reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
    //                 isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
    //             }
    //         },
    //         // Final projection
    //         {
    //             $project: {
    //                 _id: 1,
    //                 content: 1,
    //                 media: 1,
    //                 user: 1,
    //                 promotion: 1,
    //                 isUploaded: 1,
    //                 target: 1,
    //                 reaction: 1,
    //                 likesCount: { $ifNull: ['$likesCount.count', 0] },
    //                 commentsCount: { $ifNull: ['$commentsCount.count', 0] },
    //                 bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
    //                 isLikedByUser: 1,
    //                 targetId: 1,
    //                 type: 1,
    //                 isBookmarkedByUser: 1,
    //                 updatedAt: 1,
    //                 createdAt: 1,
    //                 sharedPost: {
    //                     $cond: {
    //                         if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
    //                         then: { $arrayElemAt: ['$sharedPostDetails', 0] },
    //                         else: null
    //                     }
    //                 }
    //             },
    //         },
    //     ]);


    //     const hasNextPage = posts.length > limit;
    //     const _posts = hasNextPage ? posts.slice(0, -1) : posts;
    //     const nextCursor = hasNextPage ? _posts[_posts.length - 1].createdAt.toISOString() : null;

    //     const results = { posts: _posts, nextCursor };
    //     return results
    // }

    async feed(userId: string, cursor: string, reelsCursor: string) {
        const postLimit = 8
        const reelsLimit = 3

        let visibility = {
            $or: [
                { visibility: 'public' },
                { $and: [{ visibility: 'private' }, { user: new Types.ObjectId(userId) }] }
            ]
        }

        // Posts query
        const postsQuery = cursor ? {
            createdAt: { $lt: new Date(cursor) },
            ...visibility,
            postType: { $in: ['post', 'plantation', 'garbage_collection', 'water_ponds', 'rain_water'] }
        } : {
            ...visibility,
            postType: { $in: ['post', 'plantation', 'garbage_collection', 'water_ponds', 'rain_water'] }
        };

        // Reels query - using a separate cursor for reels pagination
        const reelsQuery = reelsCursor
            ? {
                createdAt: { $lt: new Date(reelsCursor) },
                ...visibility,
                postType: { $in: ['post'] },
                'media.type': 'video'
            }
            : {
                ...visibility,
                postType: { $in: ['post'] },
                'media.type': 'video'
            };

        // Pipeline to process posts/reels with all required lookups
        const createPipeline: any = (query, limit) => [
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            // Target lookup section - Look up possible targets from different collections
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
            // Handle user object ID conversion for group posts
            {
                $addFields: {
                    userObjectId: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $eq: [{ $type: "$user" }, "string"] },
                                    then: { $toObjectId: "$user" },
                                    else: "$user"
                                }
                            },
                            else: null
                        }
                    }
                }
            },
            // Shared post lookup with enhanced structure to match main post
            {
                $lookup: {
                    from: 'posts',
                    let: { sharedPostId: '$sharedPost' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ['$$sharedPostId', null] },
                                        { $eq: ['$_id', '$$sharedPostId'] }
                                    ]
                                }
                            }
                        },
                        // Target lookup for shared post
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
                        // Handle user for shared post
                        {
                            $addFields: {
                                userObjectId: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $eq: [{ $type: "$user" }, "string"] },
                                                then: { $toObjectId: "$user" },
                                                else: "$user"
                                            }
                                        },
                                        else: null
                                    }
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                let: { userId: "$userObjectId", postType: "$type" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$$postType", "group"] },
                                                    { $eq: ["$_id", "$$userId"] }
                                                ]
                                            }
                                        }
                                    },
                                    { $limit: 1 }
                                ],
                                as: "userDetails"
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'regularUserDetails'
                            }
                        },
                        {
                            $lookup: {
                                from: 'environmentalcontributions',
                                let: { postId: '$_id', postType: '$postType' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$postId', '$$postId'] },
                                                    { $in: ['$$postType', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'environmentalContributions'
                            }
                        },
                        {
                            $addFields: {
                                user: {
                                    $cond: {
                                        if: { $eq: ["$type", "group"] },
                                        then: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$userDetails" }, 0] },
                                                then: { $arrayElemAt: ["$userDetails", 0] },
                                                else: null
                                            }
                                        },
                                        else: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                                then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                                else: "$user"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        // Handle likes for shared post
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
                        // Handle bookmarks for shared post
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
                        // Handle counters for shared post
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
                                                    { $in: ['$type', ['likes', 'comments', 'bookmarks', 'shares', 'videoViews']] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'counters'
                            }
                        },
                        // Environmental profile lookup for shared post target
                        {
                            $lookup: {
                                from: 'counters',
                                let: { targetId: '$targetId' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$targetId', '$$targetId'] },
                                                    { $in: ['$name', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] },
                                                    { $eq: ['$type', 'contributions'] }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: null,
                                            contributionTypes: { $addToSet: '$name' }
                                        }
                                    }
                                ],
                                as: 'targetEnvironmentalContributions'
                            }
                        },
                        // Combine fields for shared post
                        {
                            $addFields: {
                                target: {
                                    $let: {
                                        vars: {
                                            targetObj: {
                                                $switch: {
                                                    branches: [
                                                        { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
                                                        { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
                                                        { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
                                                    ],
                                                    default: null
                                                }
                                            },
                                            envContributions: { $arrayElemAt: ['$targetEnvironmentalContributions.contributionTypes', 0] }
                                        },
                                        in: {
                                            $cond: {
                                                if: {
                                                    $and: [
                                                        { $ne: ['$$targetObj', null] },
                                                        { $ne: ['$$targetObj.type', 'group'] }
                                                    ]
                                                },
                                                then: {
                                                    $mergeObjects: [
                                                        '$$targetObj',
                                                        {
                                                            environmentalProfile: {
                                                                plantation: { $in: ['plantation', { $ifNull: ['$$envContributions', []] }] },
                                                                garbage_collection: { $in: ['garbage_collection', { $ifNull: ['$$envContributions', []] }] },
                                                                water_ponds: { $in: ['water_ponds', { $ifNull: ['$$envContributions', []] }] },
                                                                rain_water: { $in: ['rain_water', { $ifNull: ['$$envContributions', []] }] }
                                                            }
                                                        }
                                                    ]
                                                },
                                                else: '$$targetObj'
                                            }
                                        }
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
                                sharesCount: {
                                    $ifNull: [
                                        { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'shares'] } } }, 0] },
                                        0
                                    ]
                                },
                                videoViewsCount: {
                                    $ifNull: [
                                        { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'videoViews'] } } }, 0] },
                                        0
                                    ]
                                },
                                bookmarksCount: {
                                    $ifNull: [
                                        { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                                        0
                                    ]
                                },
                                isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                                reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                                isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'mentions',
                                foreignField: '_id',
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            username: 1,
                                            firstname: 1,
                                            lastname: 1,
                                            profile: 1
                                        }
                                    }
                                ],
                                as: 'mentions'
                            }
                        },
                        // Project shared post fields
                        {
                            $project: {
                                _id: 1,
                                content: 1,
                                media: 1,
                                user: 1,
                                promotion: 1,
                                isUploaded: 1,
                                target: 1,
                                location: 1,
                                projectDetails: 1,
                                environmentalContributions: 1,
                                postType: 1,
                                mentions: 1,
                                reaction: 1,
                                videoViewsCount: { $ifNull: ['$videoViewsCount.count', 0] },
                                likesCount: { $ifNull: ['$likesCount.count', 0] },
                                commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                                bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                                sharesCount: { $ifNull: ['$sharesCount.count', 0] },
                                isLikedByUser: 1,
                                targetId: 1,
                                type: 1,
                                backgroundColor: 1,
                                isBookmarkedByUser: 1,
                                hashtags: 1,
                                updatedAt: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    as: 'sharedPostDetails'
                }
            },
            // User lookup for main post
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userObjectId", postType: "$type" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$postType", "group"] },
                                        { $eq: ["$_id", "$$userId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "userDetails"
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'regularUserDetails'
                }
            },
            {
                $addFields: {
                    user: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $gt: [{ $size: "$userDetails" }, 0] },
                                    then: { $arrayElemAt: ["$userDetails", 0] },
                                    else: null
                                }
                            },
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                    then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                    else: "$user"
                                }
                            }
                        }
                    }
                }
            },
            // Bookmark lookup for main post
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
            // Like lookup for main post
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
            // Counter lookup for main post
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
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks', 'shares', 'videoViews']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'counters'
                }
            },
            // Environmental profile lookup for main post target
            {
                $lookup: {
                    from: 'counters',
                    let: { targetId: '$targetId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$targetId'] },
                                        { $in: ['$name', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] },
                                        { $eq: ['$type', 'contributions'] }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                contributionTypes: { $addToSet: '$name' }
                            }
                        }
                    ],
                    as: 'targetEnvironmentalContributions'
                }
            },
            {
                $lookup: {
                    from: 'environmentalcontributions',
                    let: { postId: '$_id', postType: '$postType' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$postId', '$$postId'] },
                                        { $in: ['$$postType', ['plantation', 'garbage_collection', 'water_ponds', 'rain_water']] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                location: 1,
                                plantationData: 1,
                                garbageCollectionData: 1,
                                waterPondsData: 1,
                                rainWaterData: 1,
                                media: 1,
                                updateHistory: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    as: 'environmentalContributions'
                }
            },
            {
                $addFields: {
                    target: {
                        $let: {
                            vars: {
                                targetObj: {
                                    $switch: {
                                        branches: [
                                            { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
                                            { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
                                            { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
                                        ],
                                        default: null
                                    }
                                },
                                envContributions: { $arrayElemAt: ['$targetEnvironmentalContributions.contributionTypes', 0] }
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $and: [
                                            { $ne: ['$$targetObj', null] },
                                            { $ne: ['$$targetObj.type', 'group'] }
                                        ]
                                    },
                                    then: {
                                        $mergeObjects: [
                                            '$$targetObj',
                                            {
                                                environmentalProfile: {
                                                    plantation: { $in: ['plantation', { $ifNull: ['$$envContributions', []] }] },
                                                    garbage_collection: { $in: ['garbage_collection', { $ifNull: ['$$envContributions', []] }] },
                                                    water_ponds: { $in: ['water_ponds', { $ifNull: ['$$envContributions', []] }] },
                                                    rain_water: { $in: ['rain_water', { $ifNull: ['$$envContributions', []] }] }
                                                }
                                            }
                                        ]
                                    },
                                    else: '$$targetObj'
                                }
                            }
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
                    sharesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'shares'] } } }, 0] },
                            0
                        ]
                    },
                    videoViewsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'videoViews'] } } }, 0] },
                            0
                        ]
                    },
                    bookmarksCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            0
                        ]
                    },
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                firstname: 1,
                                lastname: 1,
                                profile: 1
                            }
                        }
                    ],
                    as: 'mentions'
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    media: 1,
                    user: 1,
                    promotion: 1,
                    isUploaded: 1,
                    target: 1,
                    location: 1,
                    projectDetails: 1,
                    environmentalContributions: 1,
                    reaction: 1,
                    postType: 1,
                    mentions: 1,
                    videoViewsCount: { $ifNull: ['$videoViewsCount.count', 0] },
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    sharesCount: { $ifNull: ['$sharesCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    backgroundColor: 1,
                    isBookmarkedByUser: 1,
                    hashtags: 1,
                    updatedAt: 1,
                    createdAt: 1,
                    sharedPost: {
                        $cond: {
                            if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
                            then: { $arrayElemAt: ['$sharedPostDetails', 0] },
                            else: null
                        }
                    }
                },
            }
        ];

        // Execute both queries in parallel
        const [postsResult, reelsResult] = await Promise.all([
            this.postModel.aggregate(createPipeline(postsQuery, postLimit)),
            this.postModel.aggregate(createPipeline(reelsQuery, reelsLimit))
        ]);

        // Process posts pagination
        const hasNextPostsPage = postsResult.length > postLimit;
        const posts = hasNextPostsPage ? postsResult.slice(0, postLimit) : postsResult;
        const nextPostsCursor = hasNextPostsPage ? posts[posts.length - 1].createdAt.toISOString() : null;

        // Process reels pagination
        const hasNextReelsPage = reelsResult.length > reelsLimit;
        const reels = hasNextReelsPage ? reelsResult.slice(0, reelsLimit) : reelsResult;
        const nextReelsCursor = hasNextReelsPage ? reels[reels.length - 1].createdAt.toISOString() : null;

        // Combine posts and reels in the response
        return {
            posts: [...posts],
            reels: [...reels],
            nextCursor: nextPostsCursor,
            nextReelsCursor: nextReelsCursor,
            hasMorePosts: hasNextPostsPage,
            hasMoreReels: hasNextReelsPage
        };
    }

    // async videosFeed(userId, cursor) {
    //     const videoLimit = 10;

    //     let visibility = {
    //         $or: [
    //             { visibility: 'public' },
    //             { $and: [{ visibility: 'private' }, { user: new Types.ObjectId(userId) }] }
    //         ]
    //     };

    //     // Videos query - only posts that have video media
    //     const videosQuery = cursor
    //         ? {
    //             createdAt: { $lt: new Date(cursor) },
    //             ...visibility,
    //             postType: "post",
    //             'media.type': 'video'  // Only include posts with video media
    //         }
    //         : {
    //             ...visibility,
    //             postType: "post",
    //             'media.type': 'video'  // Only include posts with video media
    //         };

    //     // Pipeline to process videos with required lookups
    //     const videosPipeline: any = [
    //         { $match: videosQuery },
    //         { $sort: { createdAt: -1 } },
    //         { $limit: videoLimit + 1 },

    //         // Target lookup section - Look up possible targets from different collections
    //         {
    //             $lookup: {
    //                 from: 'users',
    //                 localField: 'targetId',
    //                 foreignField: '_id',
    //                 as: 'userTarget'
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: 'groups',
    //                 localField: 'targetId',
    //                 foreignField: '_id',
    //                 as: 'groupTarget'
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: 'pages',
    //                 localField: 'targetId',
    //                 foreignField: '_id',
    //                 as: 'pageTarget'
    //             }
    //         },

    //         // Handle user object ID conversion for group posts
    //         {
    //             $addFields: {
    //                 userObjectId: {
    //                     $cond: {
    //                         if: { $eq: ["$type", "group"] },
    //                         then: {
    //                             $cond: {
    //                                 if: { $eq: [{ $type: "$user" }, "string"] },
    //                                 then: { $toObjectId: "$user" },
    //                                 else: "$user"
    //                             }
    //                         },
    //                         else: null
    //                     }
    //                 }
    //             }
    //         },

    //         // User lookup for post
    //         {
    //             $lookup: {
    //                 from: "users",
    //                 let: { userId: "$userObjectId", postType: "$type" },
    //                 pipeline: [
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $and: [
    //                                     { $eq: ["$$postType", "group"] },
    //                                     { $eq: ["$_id", "$$userId"] }
    //                                 ]
    //                             }
    //                         }
    //                     },
    //                     { $limit: 1 }
    //                 ],
    //                 as: "userDetails"
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: 'users',
    //                 localField: 'user',
    //                 foreignField: '_id',
    //                 as: 'regularUserDetails'
    //             }
    //         },
    //         {
    //             $addFields: {
    //                 user: {
    //                     $cond: {
    //                         if: { $eq: ["$type", "group"] },
    //                         then: {
    //                             $cond: {
    //                                 if: { $gt: [{ $size: "$userDetails" }, 0] },
    //                                 then: { $arrayElemAt: ["$userDetails", 0] },
    //                                 else: null
    //                             }
    //                         },
    //                         else: {
    //                             $cond: {
    //                                 if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
    //                                 then: { $arrayElemAt: ["$regularUserDetails", 0] },
    //                                 else: "$user"
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         },

    //         // Bookmark lookup for post
    //         {
    //             $lookup: {
    //                 from: 'bookmarks',
    //                 let: { postId: '$_id' },
    //                 pipeline: [
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $and: [
    //                                     { $eq: ['$postId', '$$postId'] },
    //                                     { $eq: ['$userId', new Types.ObjectId(userId)] },
    //                                 ],
    //                             },
    //                         },
    //                     },
    //                 ],
    //                 as: 'userBookmark',
    //             },
    //         },

    //         // Like lookup for post
    //         {
    //             $lookup: {
    //                 from: 'likes',
    //                 let: { postId: '$_id' },
    //                 pipeline: [
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $and: [
    //                                     { $eq: ['$targetId', '$$postId'] },
    //                                     { $eq: ['$userId', new Types.ObjectId(userId)] },
    //                                     { $eq: ['$type', "post"] },
    //                                 ],
    //                             },
    //                         },
    //                     },
    //                 ],
    //                 as: 'userLike',
    //             },
    //         },

    //         // Counter lookup for post
    //         {
    //             $lookup: {
    //                 from: 'counters',
    //                 let: { postId: '$_id' },
    //                 pipeline: [
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $and: [
    //                                     { $eq: ['$targetId', '$$postId'] },
    //                                     { $eq: ['$name', 'post'] },
    //                                     { $in: ['$type', ['likes', 'comments', 'bookmarks']] }
    //                                 ]
    //                             }
    //                         }
    //                     }
    //                 ],
    //                 as: 'counters'
    //             }
    //         },

    //         // Combine fields for post
    //         {
    //             $addFields: {
    //                 target: {
    //                     $switch: {
    //                         branches: [
    //                             { case: { $gt: [{ $size: '$userTarget' }, 0] }, then: { $arrayElemAt: ['$userTarget', 0] } },
    //                             { case: { $gt: [{ $size: '$pageTarget' }, 0] }, then: { $arrayElemAt: ['$pageTarget', 0] } },
    //                             { case: { $gt: [{ $size: '$groupTarget' }, 0] }, then: { $arrayElemAt: ['$groupTarget', 0] } }
    //                         ],
    //                         default: null
    //                     }
    //                 },
    //                 likesCount: {
    //                     $ifNull: [
    //                         { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
    //                         0
    //                     ]
    //                 },
    //                 commentsCount: {
    //                     $ifNull: [
    //                         { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
    //                         0
    //                     ]
    //                 },
    //                 bookmarksCount: {
    //                     $ifNull: [
    //                         { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
    //                         0
    //                     ]
    //                 },
    //                 isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
    //                 reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
    //                 isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
    //                 // Filter media to only include videos
    //                 videoMedia: {
    //                     $filter: {
    //                         input: '$media',
    //                         as: 'mediaItem',
    //                         cond: { $eq: ['$mediaItem.type', 'video'] }
    //                     }
    //                 },
    //                 // Get only the first video
    //                 firstVideo: {
    //                     $arrayElemAt: [
    //                         {
    //                             $filter: {
    //                                 input: '$media',
    //                                 as: 'mediaItem',
    //                                 cond: { $eq: ['$mediaItem.type', 'video'] }
    //                             }
    //                         },
    //                         0
    //                     ]
    //                 }
    //             }
    //         },

    //         // Final projection with video filtering
    //         {
    //             $project: {
    //                 _id: 1,
    //                 content: 1,
    //                 // Only include the first video media
    //                 media: {
    //                     $cond: {
    //                         if: { $gt: [{ $size: '$videoMedia' }, 0] },
    //                         then: [{ $arrayElemAt: ['$videoMedia', 0] }],
    //                         else: []
    //                     }
    //                 },
    //                 user: 1,
    //                 promotion: 1,
    //                 isUploaded: 1,
    //                 target: 1,
    //                 reaction: 1,
    //                 postType: 1,
    //                 likesCount: { $ifNull: ['$likesCount.count', 0] },
    //                 commentsCount: { $ifNull: ['$commentsCount.count', 0] },
    //                 bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
    //                 isLikedByUser: 1,
    //                 targetId: 1,
    //                 type: 1,
    //                 isBookmarkedByUser: 1,
    //                 updatedAt: 1,
    //                 createdAt: 1
    //             },
    //         },
    //         // Filter out posts with no videos
    //         {
    //             $match: {
    //                 "media.0": { $exists: true }
    //             }
    //         }
    //     ];

    //     // Execute the query
    //     const videosResult = await this.postModel.aggregate(videosPipeline);

    //     // Process pagination and ensure all posts have videos
    //     const filteredVideos = videosResult.filter(post => post.media && post.media.length > 0);
    //     const hasNextPage = videosResult.length > videoLimit;
    //     const videos = hasNextPage ? filteredVideos.slice(0, videoLimit) : filteredVideos;
    //     const nextCursor = hasNextPage && videos.length > 0
    //         ? videos[videos.length - 1].createdAt.toISOString()
    //         : null;

    //     return {
    //         videos,
    //         nextCursor,
    //         hasMore: hasNextPage
    //     };
    // }

    async videosFeed(userId: string, cursor: string, postId?: string) {
        const videoLimit = 8;

        console.log('videosFeed params:', { userId, cursor, postId });

        let visibility: any = {
            $or: [
                { visibility: 'public' },
                { $and: [{ visibility: 'private' }, { user: new Types.ObjectId(userId) }] }
            ]
        };

        // Build our query based on inputs
        let matchQuery: any = {
            ...visibility,
            postType: "post",
            'media.type': 'video'
        };

        // If we have a postId, use it as our starting point
        if (postId && !cursor) {
            try {
                // First, fetch the postId item to get its creation date
                // We'll need this to use as a reference point
                const initialPost = await this.postModel.findOne({
                    _id: new Types.ObjectId(postId),
                    ...visibility
                }).lean();

                if (initialPost) {
                    console.log(`Found initial post with ID ${postId}, created at ${initialPost.createdAt}`);

                    // Set up a query for posts created at the same time or earlier
                    // This ensures we include the initial post and anything newer
                    matchQuery.createdAt = { $lte: initialPost.createdAt };
                } else {
                    console.log(`Initial post with ID ${postId} not found, using regular feed`);
                }
            } catch (error) {
                console.error("Invalid postId format or error fetching:", error);
            }
        }
        // Standard cursor-based pagination when no initial postId or when loading more
        else if (cursor) {
            matchQuery.createdAt = { $lt: new Date(cursor) };
        }

        // Pipeline to process videos with required lookups
        const videosPipeline: any = [
            { $match: matchQuery },
            // Sort by newest first
            { $sort: { createdAt: -1 } },
            // Limit to slightly more than what we need, to account for filtering
            { $limit: videoLimit + 2 },

            // Target lookup section and all the rest of your pipeline...
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

            // Handle user object ID conversion for group posts
            {
                $addFields: {
                    userObjectId: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $eq: [{ $type: "$user" }, "string"] },
                                    then: { $toObjectId: "$user" },
                                    else: "$user"
                                }
                            },
                            else: null
                        }
                    }
                }
            },

            // User lookup for post
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userObjectId", postType: "$type" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$postType", "group"] },
                                        { $eq: ["$_id", "$$userId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "userDetails"
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'regularUserDetails'
                }
            },
            {
                $addFields: {
                    user: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $gt: [{ $size: "$userDetails" }, 0] },
                                    then: { $arrayElemAt: ["$userDetails", 0] },
                                    else: null
                                }
                            },
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                    then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                    else: "$user"
                                }
                            }
                        }
                    }
                }
            },

            // Bookmark lookup for post
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

            // Like lookup for post
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

            // Counter lookup for post
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
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks', 'videoViews', 'shares']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'counters'
                }
            },

            // Combine fields for post
            {
                $addFields: {
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
                    videoViewsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'videoViews'] } } }, 0] },
                            0
                        ]
                    },
                    bookmarksCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            0
                        ]
                    },
                    sharesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'shares'] } } }, 0] },
                            0
                        ]
                    },
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                    // Filter media to only include videos
                    videoMedia: {
                        $filter: {
                            input: '$media',
                            as: 'mediaItem',
                            cond: { $eq: ['$$mediaItem.type', 'video'] }
                        }
                    },
                    // Get only the first video
                    firstVideo: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$media',
                                    as: 'mediaItem',
                                    cond: { $eq: ['$$mediaItem.type', 'video'] }
                                }
                            },
                            0
                        ]
                    }
                }
            },

            {
                $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                firstname: 1,
                                lastname: 1,
                                profile: 1
                            }
                        }
                    ],
                    as: 'mentions'
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    // Only include the first video media
                    media: {
                        $cond: {
                            if: { $gt: [{ $size: '$videoMedia' }, 0] },
                            then: [{ $arrayElemAt: ['$videoMedia', 0] }],
                            else: []
                        }
                    },
                    user: 1,
                    promotion: 1,
                    isUploaded: 1,
                    target: 1,
                    reaction: 1,
                    postType: 1,
                    mentions: 1,
                    videoViewsCount: { $ifNull: ['$videoViewsCount.count', 0] },
                    sharesCount: { $ifNull: ['$sharesCount.count', 0] },
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    isBookmarkedByUser: 1,
                    updatedAt: 1,
                    createdAt: 1
                },
            },
            // Filter out posts with no videos
            {
                $match: {
                    "media.0": { $exists: true }
                }
            }
        ];
        const videosResult = await this.postModel.aggregate(videosPipeline);

        // If we're using an initial postId, make sure it's the first in the list
        let processedVideos = videosResult;

        if (postId && !cursor && videosResult.length > 0) {
            const initialPostIndex = videosResult.findIndex(post => post._id.toString() === postId);

            if (initialPostIndex > 0) {
                // Remove it from its current position
                const initialPost = videosResult.splice(initialPostIndex, 1)[0];
                // Add it to the start
                processedVideos = [initialPost, ...videosResult];
                console.log(`Moved initial post to first position`);
            } else if (initialPostIndex === 0) {
                console.log(`Initial post already at first position`);
            } else {
                console.log(`Initial post not found in results, using feed as-is`);
            }
        }

        // Ensure we don't exceed our limit
        const hasNextPage = processedVideos.length > videoLimit;
        const videos = hasNextPage ? processedVideos.slice(0, videoLimit) : processedVideos;

        const nextCursor = hasNextPage && videos.length > 0
            ? videos[videos.length - 1].createdAt.toISOString()
            : null;

        console.log(`Returning ${videos.length} videos, hasNextPage: ${hasNextPage}`);

        return {
            posts: videos,
            nextCursor,
            hasMore: hasNextPage
        };
    }

    async reelsFeed(userId, cursor, postId) {
        const limit = 8;

        console.log('reelsFeed params:', { userId, cursor, postId });

        let visibility = {
            $or: [
                { visibility: 'public' },
                { $and: [{ visibility: 'private' }, { user: new Types.ObjectId(userId) }] }
            ]
        };

        // Build our query based on inputs
        let matchQuery = {
            ...visibility,
            postType: 'post',
            isUploaded: null
        };

        // If we have an postId, use it as our starting point
        if (postId && !cursor) {
            try {
                // First, fetch the postId item to get its creation date
                const initialReel = await this.postModel.findOne({
                    _id: new Types.ObjectId(postId),
                    ...visibility,
                    postType: 'post'
                }).lean();

                if (initialReel) {
                    console.log(`Found initial reel with ID ${postId}, created at ${initialReel.createdAt}`);

                    // Set up a query for reels created at the same time or earlier
                    matchQuery['createdAt'] = { $lte: initialReel.createdAt };
                } else {
                    console.log(`Initial reel with ID ${postId} not found, using regular feed`);
                }
            } catch (error) {
                console.error("Invalid postId format or error fetching:", error);
            }
        }
        // Standard cursor-based pagination when no initial reel or when loading more
        else if (cursor) {
            matchQuery['createdAt'] = { $lt: new Date(cursor) };
        }

        const reels = await this.postModel.aggregate([
            { $match: matchQuery },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            // Target lookup section - Look up possible targets from different collections
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
            // Handle user object ID conversion for group posts
            {
                $addFields: {
                    userObjectId: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $eq: [{ $type: "$user" }, "string"] },
                                    then: { $toObjectId: "$user" },
                                    else: "$user"
                                }
                            },
                            else: null
                        }
                    }
                }
            },

            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userObjectId", postType: "$type" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$postType", "group"] },
                                        { $eq: ["$_id", "$$userId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "userDetails"
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'regularUserDetails'
                }
            },
            {
                $addFields: {
                    user: {
                        $cond: {
                            if: { $eq: ["$type", "group"] },
                            then: {
                                $cond: {
                                    if: { $gt: [{ $size: "$userDetails" }, 0] },
                                    then: { $arrayElemAt: ["$userDetails", 0] },
                                    else: null
                                }
                            },
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: "$regularUserDetails" }, 0] },
                                    then: { $arrayElemAt: ["$regularUserDetails", 0] },
                                    else: "$user"
                                }
                            }
                        }
                    }
                }
            },
            // Bookmark lookup for main post
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
            // Like lookup for main post
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
                                        { $eq: ['$type', "reel"] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'userLike',
                },
            },
            // Counter lookup for main post
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
                                        { $eq: ['$name', 'reel'] },
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks', 'shares', 'videoViews']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'counters'
                }
            },
            // Combine fields for main post
            {
                $addFields: {
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
                    videoViewsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'videoViews'] } } }, 0] },
                            0
                        ]
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
                    sharesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'shares'] } } }, 0] },
                            0
                        ]
                    },
                    bookmarksCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            0
                        ]
                    },
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                }
            },
            // Final projection
            {
                $project: {
                    _id: 1,
                    content: 1,
                    media: 1,
                    user: 1,
                    promotion: 1,
                    isUploaded: 1,
                    postType: 1,
                    target: 1,
                    reaction: 1,
                    videoViewsCount: { $ifNull: ['$videoViewsCount.count', 0] },
                    sharesCount: { $ifNull: ['$sharesCount.count', 0] },
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    isLikedByUser: 1,
                    targetId: 1,
                    type: 1,
                    isBookmarkedByUser: 1,
                    updatedAt: 1,
                    createdAt: 1,
                    // sharedPost: {
                    //     $cond: {
                    //         if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
                    //         then: { $arrayElemAt: ['$sharedPostDetails', 0] },
                    //         else: null
                    //     }
                    // }
                },
            },
        ]);
        // If we're using an postId, make sure it's the first in the list
        let processedReels = reels;

        if (postId && !cursor && reels.length > 0) {
            const initialReelIndex = reels.findIndex(reel => reel._id.toString() === postId);

            if (initialReelIndex > 0) {
                // Remove it from its current position
                const initialReel = reels.splice(initialReelIndex, 1)[0];
                // Add it to the start
                processedReels = [initialReel, ...reels];
                console.log(`Moved initial reel to first position`);
            } else if (initialReelIndex === 0) {
                console.log(`Initial reel already at first position`);
            } else {
                console.log(`Initial reel not found in results, using feed as-is`);
            }
        }

        const hasNextPage = processedReels.length > limit;
        const _reels = hasNextPage ? processedReels.slice(0, limit) : processedReels;
        const nextCursor = hasNextPage && _reels.length > 0
            ? _reels[_reels.length - 1].createdAt.toISOString()
            : null;

        const results = { posts: _reels, nextCursor };
        return results;
    }

    async viewPost({ userId, postId, type }: SViewPost) {
        const post = await this.postModel.findById(postId)
        if (!post) {
            throw new BadRequestException()
        }

        if (String(post.user) == userId) {
            return null
        }

        if (type == 'normal') {
            const viewedPost = await this.viewPostsModel.updateOne(
                { type, userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) },
                { $setOnInsert: { type, userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) } },
                { upsert: true }
            )
            return viewedPost
        }

        if (type !== 'promotion') {
            throw new BadRequestException()
        }


        const viewedPost = await this.viewPostsModel.updateOne(
            { type, userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) },
            { $setOnInsert: { type, userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) } },
            { upsert: true }
        )

        const _promotedPost = await this.promotionModel.findOne({ postId: new Types.ObjectId(postId), active: 1 })
        if ((Number(_promotedPost.reach) + 1) >= Number(_promotedPost.reachTarget) && _promotedPost.reachStatus !== ReachStatus.COMPLETED) {
            _promotedPost.reachStatus = ReachStatus.COMPLETED
            _promotedPost.active = 0
            _promotedPost.reach = Number(_promotedPost.reach) + 1
            _promotedPost.save()
            return viewedPost
        }

        if (viewedPost.upsertedCount > 0 && (Number(_promotedPost.reach) + 1) < Number(_promotedPost.reachTarget)) {
            await this.promotionModel.findOneAndUpdate({ postId: new Types.ObjectId(postId), active: 1 }, { $inc: { reach: 1 } })
        }
        return viewedPost
    }

    // async bulkViewPosts({ userId, postIds, type }: SBulkViewPost) {

    //     try {
    //         let viewPosts = postIds.map(
    //             async (postId) => {
    //                 const post = await this.postModel.findById(postId)
    //                 if (!post) {
    //                     throw new BadRequestException()
    //                 }
    //                 await this.viewPostsModel.updateOne(
    //                     { type, userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) },
    //                     { $setOnInsert: { type, userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) } },
    //                     { upsert: true }
    //                 )

    //                 if (type == 'video') {
    //                     await this.metricsAggregatorService.incrementCount(new Types.ObjectId(postId), 'post', "videoViews")
    //                 }
    //             })

    //         if (Promise.all(viewPosts)) {
    //             return true
    //         }
    //     } catch (error) {
    //         return false
    //     }

    // }

    async bulkViewPosts({ userId, postIds, type }: SBulkViewPost) {
        console.log(userId, postIds, type);
        try {
            // Convert userId to ObjectId once
            const userObjectId = new Types.ObjectId(userId);

            // Convert postIds to ObjectIds
            const postObjectIds = postIds.map(id => new Types.ObjectId(id));

            // Verify all posts exist in a single query
            const existingPosts = await this.postModel.find({
                _id: { $in: postObjectIds }
            }, { _id: 1 }).lean();

            console.log(existingPosts, 'existing posts');

            if (existingPosts.length !== postIds.length) {
                throw new BadRequestException('One or more posts do not exist');
            }

            // Start a MongoDB session for transaction
            // const session = await startSession();
            // session.startTransaction();

            try {
                // Create bulk operations for inserting unique views
                const bulkOps = postObjectIds.map(postId => ({
                    updateOne: {
                        filter: {
                            type,
                            userId: userObjectId,
                            postId
                        },
                        update: {
                            $setOnInsert: {
                                type,
                                userId: userObjectId,
                                postId,
                                createdAt: new Date()
                            }
                        },
                        upsert: true
                    }
                }));

                const result = await this.viewPostsModel.bulkWrite(bulkOps, {
                    ordered: false
                });

                const newlyViewedCount = result.upsertedCount;

                if (type === 'video' && newlyViewedCount > 0) {
                    const newlyViewedPostIds = [];

                    for (const key in result.upsertedIds) {
                        const index = parseInt(key);
                        const originalPostId = postObjectIds[index];
                        newlyViewedPostIds.push(originalPostId);
                    }

                    const incrementOps = newlyViewedPostIds.map(postId => ({
                        updateOne: {
                            filter: { _id: postId },
                            update: { $inc: { videoViews: 1 } }
                        }
                    }));

                    if (incrementOps.length > 0) {
                        await this.postModel.bulkWrite(incrementOps, {
                        });
                    }

                    if (newlyViewedPostIds.length > 0) {
                        await Promise.all(
                            newlyViewedPostIds.map(postId =>
                                this.metricsAggregatorService.incrementCount(
                                    postId,
                                    'post',
                                    "videoViews",
                                )
                            )
                        );
                    }
                }

                return true;

            } catch (error) {
                console.error('Error in bulkViewPosts transaction:', error);
                return false;
            }
        } catch (error) {
            console.error('Error in bulkViewPosts:', error);
            return false;
        }
    }
    async testingPromotedPosts(address) {
        // await this.postModel.deleteMany()
        // await this.promotionModel.deleteMany()
        // const feedPosts = await this.postModel.aggregate([
        //     {
        //         $lookup: {
        //             from: 'promotions',
        //             localField: '_id',
        //             foreignField: 'postId',
        //             as: 'promotedInfo',
        //         },
        //     },
        //     {
        //         $match: {
        //             $and: [
        //                 { 'promotedInfo.0': { $exists: true } }, // Is a promoted post
        //                 {
        //                     $or: [
        //                         { 'promotedInfo.targetAddress.country': null }, // International posts
        //                         {
        //                             $and: [
        //                                 { 'promotedInfo.targetAddress.country': address.country },
        //                                 { 'promotedInfo.targetAddress.city': null },
        //                                 { 'promotedInfo.targetAddress.area': null },
        //                             ]
        //                         }, // Country-only targeting
        //                         {
        //                             $and: [
        //                                 { 'promotedInfo.targetAddress.country': address.country },
        //                                 { 'promotedInfo.targetAddress.city': address.city },
        //                                 { 'promotedInfo.targetAddress.area': null },
        //                             ]
        //                         }, // Country and city targeting
        //                         {
        //                             $and: [
        //                                 { 'promotedInfo.targetAddress.country': address.country },
        //                                 { 'promotedInfo.targetAddress.city': address.city },
        //                                 { 'promotedInfo.targetAddress.area': address.area },
        //                             ]
        //                         }, // Exact match on country, city, and area
        //                     ]
        //                 }
        //             ]
        //         },
        //     },
        //     {
        //         $addFields: {
        //             isPromoted: {
        //                 $cond: {
        //                     if: { $gt: [{ $size: '$promotedInfo' }, 0] },
        //                     then: true,
        //                     else: false,
        //                 },
        //             },
        //         },
        //     },
        //     {
        //         $project: {
        //             promotedInfo: 0, // Remove the promotedInfo field from the result
        //         },
        //     },
        // ]);
        // const promotedPosts = await this.promotionModel.aggregate([
        //     {
        //         $match: {
        //             $or: [
        //                 { 'targetAdress.country': null }, // International posts
        //                 {
        //                     $and: [
        //                         { 'targetAdress.country': address.country },
        //                         { 'targetAdress.city': null },
        //                         { 'targetAdress.area': null },
        //                     ]
        //                 }, // Country-only targeting
        //                 {
        //                     $and: [
        //                         { 'targetAdress.country': address.country },
        //                         { 'targetAdress.city': address.city },
        //                         { 'targetAdress.area': null },
        //                     ]
        //                 }, // Country and city targeting
        //                 {
        //                     $and: [
        //                         { 'targetAdress.country': address.country },
        //                         { 'targetAdress.city': address.city },
        //                         { 'targetAdress.area': address.area },
        //                     ]
        //                 }, // Exact match on country, city, and area
        //             ]
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: 'posts',
        //             localField: 'postId',
        //             foreignField: '_id',
        //             as: 'postDetails',
        //         },
        //     },
        //     {
        //         $unwind: '$postDetails',
        //     },
        //     {
        //         $lookup: {
        //             from: 'viewedposts',
        //             let: { postId: '$postId' },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ['$userId', new Types.ObjectId(userId)] },
        //                                 { $eq: ['$postId', '$$postId'] }
        //                             ]
        //                         }
        //                     }
        //                 }
        //             ],
        //             as: 'viewed'
        //         }
        //     },
        //     {
        //         $match: { viewed: { $size: 0 } }
        //     },
        //     {
        //         $project: {
        //             _id: '$postDetails._id',
        //             title: '$postDetails.title',
        //             content: '$postDetails.content',
        //             // Include other fields from the post as needed
        //             promotedId: '$_id',
        //             targetAddress: 1,
        //             // Include other fields from the promoted post as needed
        //         },
        //     },
        // ]);

        // return promotedPosts;
    }

    async getPromotedPosts(userId, address) {
        // const viewedPosts = await this.viewPostsModel.find({ userId, type: "promotion" }).distinct("postId")
        // const promotedPosts = await this.promotionModel.find({ postId: { $nin: viewedPosts }, reachTarget: { ...reachTarget } })
        // return promotedPosts

        // let sponsoredPost = await this.postModel.aggregate([
        //     {
        //         $lookup: {
        //             from: 'promotions',
        //             localField: '_id',
        //             foreignField: 'postId',
        //             as: 'promotion'
        //         }
        //     },
        //     // Unwind the promotion array (there should be only one match anyway)
        //     { $unwind: '$promotion' },
        //     // Match promotions for the user's country and where reach is less than target reach
        //     // Join with the viewed posts collection
        //     {
        //         $lookup: {
        //             from: 'viewedposts',
        //             let: { postId: '$_id' },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ['$userId', new Types.ObjectId(userId)] },
        //                                 { $eq: ['$postId', '$$postId'] }
        //                             ]
        //                         }
        //                     }
        //                 }
        //             ],
        //             as: 'viewed'
        //         }
        //     },
        //     // Only select posts that haven't been viewed (i.e., where 'viewed' array is empty)
        //     { $match: { viewed: { $size: 0 } } },
        //     { $sample: { size: 5 } }
        // ]).exec();
        const promotedPosts = await this.promotionModel.aggregate([
            {
                $match: {
                    $or: [
                        { 'targetAdress.country': null }, // International posts
                        {
                            $and: [
                                { 'targetAdress.country': address.country },
                                { 'targetAdress.city': null },
                                { 'targetAdress.area': null },
                            ]
                        }, // Country-only targeting
                        {
                            $and: [
                                { 'targetAdress.country': address.country },
                                { 'targetAdress.city': address.city },
                                { 'targetAdress.area': null },
                            ]
                        }, // Country and city targeting
                        {
                            $and: [
                                { 'targetAdress.country': address.country },
                                { 'targetAdress.city': address.city },
                                { 'targetAdress.area': address.area },
                            ]
                        }, // Exact match on country, city, and area
                    ]
                },
            },
            {
                $lookup: {
                    from: 'posts',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'postDetails',


                },
            },
            {
                $unwind: '$postDetails',
            },
            {
                $lookup: {
                    from: 'viewedposts',
                    let: { postId: '$postId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$userId', new Types.ObjectId(userId)] },
                                        { $eq: ['$postId', '$$postId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'viewed'
                }
            },
            {
                $match: { viewed: { $size: 0 } }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'postDetails.targetId',
                    foreignField: '_id',
                    as: 'userTarget'
                }
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: 'postDetails.targetId',
                    foreignField: '_id',
                    as: 'groupTarget'
                }
            },
            {
                $lookup: {
                    from: 'pages',
                    localField: 'postDetails.targetId',
                    foreignField: '_id',
                    as: 'pageTarget'
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
                                        { $eq: ['$type', 'post'] },
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
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
                    isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
                    isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
                    likesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    commentsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    bookmarksCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            { count: 0 }
                        ]
                    },
                    target: {
                        $cond: {
                            if: { $gt: [{ $size: '$userTarget' }, 0] },
                            then: { $arrayElemAt: ['$userTarget', 0] },
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: '$groupTarget' }, 0] },
                                    then: { $arrayElemAt: ['$groupTarget', 0] },
                                    else: {
                                        $cond: {
                                            if: { $gt: [{ $size: '$pageTarget' }, 0] },
                                            then: { $arrayElemAt: ['$pageTarget', 0] },
                                            else: null
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: '$postDetails._id',
                    title: '$postDetails.title',
                    content: '$postDetails.content',
                    targetId: '$postDetails.targetId',
                    target: 1,
                    promotedId: '$_id',
                    targetAddress: 1,
                    media: 1,
                    reaction: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    likesCount: { $ifNull: ['$likesCount.count', 0] },
                    commentsCount: { $ifNull: ['$commentsCount.count', 0] },
                    bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
                    user: 1,
                    isLikedByUser: 1,
                    isBookmarkedByUser: 1,
                    // Include other fields as needed
                },
            },
        ]);
        return promotedPosts
    }

    async promotionActivationToggle(postId) {
        const updatedPromotion = await this.promotionModel.findOneAndUpdate({ postId: new Types.ObjectId(postId) }, [
            {
                $set: {
                    active: {
                        $cond: {
                            if: { $eq: ["$active", 1] },
                            then: 0,
                            else: 1,
                        }
                    }
                }
            }
        ], { new: true })
        return updatedPromotion
    }

    async getPromotions(cursor, userId, reverse) {
        const limit = 6
        let _reverse: any = reverse == 'true' ? { createdAt: 1 } : { createdAt: -1 }
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        const query = { ..._cursor, user: userId }
        const promotions = await this.promotionModel.aggregate([
            { $match: query },
            { $sort: _reverse },
            { $limit: limit + 1 },
            // {
            // $group: {
            // _id: null,
            // totalCost: { $sum: "$paymentDetails.totalAmount" },
            // totalReach: { $sum: "$reach" },
            // activeCampaigns: { $sum: "$active" },
            // promotions: { $push: "$$ROOT" }
            // }
            // }
        ])
        const promotionsData = await this.promotionModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalCampaigns: { $sum: 1 },
                    activeCampaigns: { $sum: '$active' },
                    totalReach: { $sum: '$reach' },
                    totalCost: {
                        $sum: {
                            $toDouble: '$paymentDetails.totalAmount'
                        }
                    }
                }
            }
        ]);

        return { promotions, promotionsData: promotionsData[0] }
    }

    async postPromotion({ postId, userId, promotionDetails, isApp }: SPostPromotion) {

        const promotion = await this.promotionModel.findOne({ postId: new Types.ObjectId(postId), user: userId, active: 1 })

        if (promotion) {
            throw new BadRequestException(POST_PROMOTION.ALREADY_ACTIVE)
        }

        await this.locationService.isValidRegisteredAddress(promotionDetails.targetAddress)

        const totalAmount = (promotionDetails.reachTarget / 1000) * 0.5

        const _promotion = await this.promotionModel.create({ user: userId, active: 0, postId: new Types.ObjectId(postId), reachTarget: promotionDetails.reachTarget, paymentDetails: { totalAmount, status: PAYMENT_STATES.PENDING }, targetAdress: promotionDetails.targetAddress })
        console.log(_promotion)

        let productDetails = [{ price_data: { unit_amount: promotionDetails.reachTarget * 0.05, currency: CURRENCIES.USD, product_data: { name: "post promotion", description: "post promotion" } }, quantity: 1 }]

        const sessionId = await this.paymentService.stripeCheckout(productDetails, userId, _promotion._id.toString(), totalAmount, isApp)
        return sessionId
    }

    async promotionPaymentSuccess(promotionId: string, totalAmount: string, paymentIntentId: string) {
        const promotion = await this.promotionModel.findByIdAndUpdate(promotionId, { $set: { active: 1, paymentDetails: { totalAmount, status: PAYMENT_STATES.PAID, paymentProvider: PAYMENT_PROVIDERS.STRIPE, paymentIntentId }, reachStatus: ReachStatus.IN_PROGRESS } })
        await this.metricsAggregatorService.incrementCount(null, "count", "campaigns")
        return promotion
    }

    async promotionPaymentFailure(promotionId: string) {
        const promotion = await this.promotionModel.findByIdAndDelete(promotionId)
        return promotion
    }

    async _getPost(postId) {
        const post = await this.postModel.findById(postId)
        return post
    }

    async getLikedUsers({ postId }) {
        const post = (await this.postModel.findById(postId)).populate("likedBy")
        return post
    }

    async likePost({ username, postId }) {
        const post: any = await this.postModel.findById(postId).populate({
            path: "user",
            model: "User"
        })
        const user: any = await this.userService.getUser(username)
        // this.notificationGateway.handleNotifications({value:username + " has liked your post", userId: user[0]._id, username: user[0].username})
        if (user[0]._id !== post.user.toString()) {

            // await this.notificationProducer.sendNotification({ value: username + " has liked your post", from: user[0]._id.toString(), user: post.user.toString(), username: post.user.username })
        }

        let isLiked = false;
        if (post.likedBy?.length > 0) {
            isLiked = post.likedBy.includes(user[0]._id)
        }

        if (isLiked) {
            let userIndex = post.likedBy.findIndex((like) => {
                if (like == user[0]._id) {
                    return like
                }
            })
            post.likedBy.splice(userIndex, 1)
            post.save()
            return post
        }

        post.likedBy.push(user[0]._id)
        post.save()
        return post
    }

    async toggleBookmark(userId: string, postId: string, targetId: string, type: string, postType: string): Promise<boolean> {
        const filter = {
            userId: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(targetId),
            postId: new Types.ObjectId(postId),
            postType,
            type
        };
        const deleteFilter = {
            userId: new Types.ObjectId(userId),
            postId: new Types.ObjectId(postId),
        };

        const deleteResult = await this.bookmarkModel.deleteOne(deleteFilter);

        if (deleteResult.deletedCount === 0) {
            await this.bookmarkModel.create(filter);
            await this.metricsAggregatorService.incrementCount(filter.postId, postType, "bookmarks")
            return true;
        }
        await this.metricsAggregatorService.decrementCount(filter.postId, postType, "bookmarks")
        return false;
    }

    async getBookmarks(cursor, userId) {
        const limit = 5
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        let query = { ..._cursor, userId: new Types.ObjectId(userId) }

        const bookmarks = await this.bookmarkModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: 'posts',
                    localField: "postId",
                    foreignField: "_id",
                    as: "post"
                }
            },
            {
                $unwind: "$post"
            },
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
                $addFields: {
                    userObjectId: {
                        $toObjectId: "$post.user",
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userObjectId", postType: "$post.type" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$$postType", "group"] },
                                        { $eq: ["$_id", "$$userId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "userDetails"
                }
            },
            {
                $addFields: {
                    user: {
                        $cond: {
                            if: { $gt: [{ $size: "$userDetails" }, 0] },
                            then: { $arrayElemAt: ["$userDetails", 0] },
                            else: null
                        }
                    },
                }
            },

            {

                $lookup: {
                    from: 'likes',
                    let: { postId: '$postId' },
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
                    from: 'counters',
                    let: { postId: '$postId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$targetId', '$$postId'] },
                                        { $eq: ['$name', 'post'] },
                                        { $in: ['$type', ['likes', 'comments', 'bookmarks', 'shares', 'videoViews']] }
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
                    "likesCount": {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'likes'] } } }, 0] },
                            0
                        ]
                    },
                    "commentsCount": {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'comments'] } } }, 0] },
                            0
                        ]
                    },
                    sharesCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'shares'] } } }, 0] },
                            0
                        ]
                    },
                    videoViewsCount: {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'videoViews'] } } }, 0] },
                            0
                        ]
                    },
                    "bookmarksCount": {
                        $ifNull: [
                            { $arrayElemAt: [{ $filter: { input: '$counters', as: 'c', cond: { $eq: ['$$c.type', 'bookmarks'] } } }, 0] },
                            0
                        ]
                    },
                    "post.isLikedByUser": { $gt: [{ $size: '$userLike' }, 0] },
                    "post.isBookmarkedByUser": true,
                    reaction: { $arrayElemAt: ['$userLike.reaction', 0] },


                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'post.mentions',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                firstname: 1,
                                lastname: 1,
                                profile: 1
                            }
                        }
                    ],
                    as: 'mentions'
                }
            },
            {
                $addFields: {
                    "post.mentions": "$mentions",
                    "post.likesCount": { $ifNull: ['$likesCount.count', 0] },
                    "post.sharesCount": { $ifNull: ['$sharesCount.count', 0] },
                    "post.videoViewsCount": { $ifNull: ['$videoViewsCount.count', 0] },
                    "post.commentsCount": { $ifNull: ['$commentsCount.count', 0] },
                    "post.bookmarksCount": { $ifNull: ['$bookmarksCount.count', 0] },
                    "post.reaction": "$reaction"
                }
            },
            {
                $project: {
                    post: 1,
                    target: 1,
                    user: 1,
                    targetId: 1,
                    type: 1,
                    updatedAt: 1,
                    createdAt: 1,
                },
            },
        ]);

        const hasNextPage = bookmarks.length > limit;
        const _bookmarks = hasNextPage ? bookmarks.slice(0, -1) : bookmarks;
        const nextCursor = hasNextPage ? _bookmarks[_bookmarks.length - 1].createdAt.toISOString() : null;

        const results = { bookmarks: _bookmarks, nextCursor };
        return results

    }

    async toggleLike({ userId, targetId, type, authorId, _targetId, targetType, reaction, postType }: { userId: string, targetId: string, type: string, authorId?: string, targetType?: string, _targetId?: string, reaction?: string, postType }): Promise<boolean> {

        let filter: {
            userId: Types.ObjectId,
            targetId: Types.ObjectId,
            type: string,
            reaction?: string
        } = {
            userId: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(targetId),
            type,
        };

        const reactions = {
            'Like': '👍',
            "Love": '❤️',
            'Haha': '😆',
            'Wow': '🤩',
            'Sad': '😢',
            'Angry': '😠',
            'Applause': '👏',
            'Fire': '🔥'
        }

        let reactionFilter;

        if (reaction) {
            reactionFilter = { ...filter, reaction }
        }

        const interactionFilter = {
            userId: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(_targetId),
        }

        const deleteResult = await this.likeModel.deleteOne(filter);

        let reactionDeleteResult;
        if (reactionFilter) {
            reactionDeleteResult = await this.likeModel.deleteOne(reactionFilter)
        }

        if (reactionDeleteResult && reactionDeleteResult.deletedCount === 0 && deleteResult.deletedCount === 0) {
            await this.likeModel.create(reactionFilter);
            if (userId != authorId) {
                await this.notificationService.createNotification(
                    {
                        from: new Types.ObjectId(userId),
                        user: new Types.ObjectId(authorId),
                        targetId: new Types.ObjectId(targetId),
                        type,
                        postType,
                        targetType,
                        value: reaction ? `has reacted on your ${type} (${reactions[reaction] || reaction})` : `has liked your ${type}`
                    }
                )
            }

            await this.metricsAggregatorService.incrementCount(filter.targetId, postType, "likes")

            if (targetType == 'user' || targetType == "page") {
                let updatedInteraction = await this.followerModel.updateOne({ follower: interactionFilter.userId, targetId: interactionFilter.targetId },
                    { $inc: { interactionScore: 1 } }
                )
            }
            if (targetType == 'group') {
                let updatedInteraction = await this.memberModel.updateOne({ member: interactionFilter.userId, groupId: interactionFilter.targetId },
                    { $inc: { interactionScore: 1 } }
                )
            }
            return true;
        }

        if ((deleteResult.deletedCount === 0 && !reactionDeleteResult) || (deleteResult.deletedCount === 0 && reactionDeleteResult.deletedCount === 1)) {

            await this.likeModel.create(filter);
            if (userId != authorId) {
                await this.notificationService.createNotification(
                    {
                        from: new Types.ObjectId(userId),
                        user: new Types.ObjectId(authorId),
                        targetId: new Types.ObjectId(targetId),
                        type,
                        postType,
                        targetType,
                        value: reaction ? `has reacted on your ${type} (${reactions[reaction] || reaction})` : `has liked your ${type}`
                    }
                )
            }

            await this.metricsAggregatorService.incrementCount(filter.targetId, (type == 'reply' || type == 'comment') ? type : postType, "likes")

            if (targetType == 'user' || targetType == "page") {
                console.log(filter)
                let updatedInteraction = await this.followerModel.updateOne({ follower: interactionFilter.userId, targetId: interactionFilter.targetId },
                    { $inc: { interactionScore: 1 } }
                )
            }
            if (targetType == 'group') {
                let updatedInteraction = await this.memberModel.updateOne({ member: interactionFilter.userId, groupId: interactionFilter.targetId },
                    { $inc: { interactionScore: 1 } }
                )
            }
            return true;
        }


        if (targetType == 'user' || targetType == "page") {
            let updatedInteraction = await this.followerModel.updateOne({ follower: interactionFilter.userId, targetId: interactionFilter.targetId },
                { $inc: { interactionScore: -1 } }
            )
        }

        if (targetType == 'group') {
            let updatedInteraction = await this.memberModel.updateOne({ member: interactionFilter.userId, groupId: interactionFilter.targetId },
                { $inc: { interactionScore: -1 } }
            )
        }

        await this.metricsAggregatorService.decrementCount(filter.targetId, type, "likes")
        return false;
    }

    async getBookmarkedPosts(username) {
        const user: any = await this.userService.getUser(username, "bookmarkedPosts")
        return user[0].bookmarkedPosts
    }

    async reportPost(postId: string, { userId, type, reportMessage }) {
        const alreadyReported = await this.reportModel.findOne({ reportedBy: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) })

        if (alreadyReported) {
            throw new BadRequestException("Already Reported")
        }

        const report = await this.reportModel.create({ reportedBy: new Types.ObjectId(userId), type, postId: new Types.ObjectId(postId), reportMessage })
        await this.metricsAggregatorService.incrementCount(null, "count", "reports")

        return report
    }

    async createPost(
        postData: any,
        userId?: string,
        hasFollowersMention?: boolean
    ) {
        const post = await this.postModel.create({ ...postData })

        if (hasFollowersMention) {
            const followers = await this.followersService.getRawFollowers(userId, 'user');
            this.notificationService.sendBulkNotifications({ users: followers, targetId: post._id.toString(), author: post.user.toString(), type: "post", postType: "post", targetType: "post", value: "has mentioned you in their post" });
        }


        if (post.mentions.length > 0) {
            this.notificationService.sendBulkNotifications({ users: post.mentions.map((userId) => userId.toString()), targetId: post._id.toString(), author: post.user.toString(), type: "post", postType: "post", targetType: "post", value: "has mentioned you in their post" });
        }

        if (post.postType && ['plantation', 'garbage_collection', 'water_ponds', 'rain_water'].includes(String(post.postType))) {
            Promise.all([
                this.metricsAggregatorService.incrementCount(null, `${String(post.postType)}_projects`, 'contributions'),
                this.metricsAggregatorService.incrementCount(null, `projects`, 'contributions')
            ])
        }
        return await post.populate({
            path: "user",
            model: "User"
        })
    }

    async createSharedPost(postData: any) {
        const post = await this.postModel.create({ ...postData })

        await this.metricsAggregatorService.incrementCount(new Types.ObjectId(postData?.sharedPost), postData?.sharedPostType, "shares")

        return await post.populate([
            {
                path: "user",
                model: "User"
            },
            {
                path: "sharedPost",
                model: "Post"
            }
        ])
    }

    async updateProject(postId: string, projectDetails: any) {
        const updatedProject = await this.postModel.findByIdAndUpdate(postId, { $set: { ...projectDetails } }, { new: true })
        return updatedProject
    }

    async updatePost(postId: string, postDetails: any,  userId?: string, hasFollowersMention?: boolean) {
        console.log(postDetails, 'post data')
        const updatedPost = await this.postModel.findByIdAndUpdate(postId, { $set: { ...postDetails } }, { new: true })

        if (hasFollowersMention) {
            const followers = await this.followersService.getRawFollowers(userId, 'user');
            this.notificationService.sendBulkNotifications({ users: followers, targetId: updatedPost._id.toString(), author: updatedPost.user.toString(), type: "post", postType: "post", targetType: "post", value: "has mentioned you in their post" });
        }


        if (updatedPost.mentions.length > 0) {
            this.notificationService.sendBulkNotifications({ users: updatedPost.mentions.map((userId) => userId.toString()), targetId: updatedPost._id.toString(), author: updatedPost.user.toString(), type: "post", postType: "post", targetType: "post", value: "has mentioned you in their post" });
        }

        if (updatedPost?.mentions?.length > 0) {
            console.log('inside mentions')
            updatedPost.mentions.forEach((userId) => {
                this.notificationService.createNotification(
                    {
                        from: new Types.ObjectId(String(updatedPost.user)),
                        user: userId,
                        targetId: updatedPost?._id,
                        type: 'post',
                        postType: 'post',
                        targetType: 'post',
                        value: 'has mentioned you in their post'
                    }
                )
            })
        }

        console.log('passed mentions')

        if (updatedPost.postType && ['plantation', 'garbage_collection', 'water_ponds', 'rain_water'].includes(String(updatedPost.postType))) {
            console.log('inside plantation')
            this.metricsAggregatorService.incrementCount(new Types.ObjectId(String(updatedPost.user)), String(updatedPost.postType), 'contributions', null, updatedPost.media.length)
        }

        console.log('passed plantation type check')
        return updatedPost
    }

    async bulkUpdate() {
        try {
            const result = await this.postModel.updateMany(
                { postType: 'post' },
                { postType: 'reel' }
            );

            console.log(`Updated ${result.modifiedCount} documents`);
            return result;
        } catch (error) {
            console.error('Error updating documents:', error);
            throw error;
        }

    }

    async deletePost(postId: any) {
        const post = await this.postModel.findByIdAndDelete(postId)
        return post
    }

    async getElementDetails(elementId: string) {
        return await this.environmentalContributionModel.findById(elementId)
            .populate('postId', 'projectDetails postType')
            .exec();
    }

    async elementExist(elementId: string) {
        return await this.environmentalContributionModel.findById(elementId)
    }

    async getProjectElements(postId: string) {
        return await this.environmentalContributionModel.aggregate([
            {
                $match: {
                    postId: new Types.ObjectId(postId)
                }
            },
            {
                $lookup: {
                    from: "posts",
                    localField: "postId",
                    foreignField: "_id",
                    as: "postId",
                    pipeline: [
                        { $project: { projectDetails: 1, postType: 1 } }
                    ]
                }
            },
            {
                $unwind: "$postId"
            }
        ]);
    }

    async getGlobalMapData(query: GetGlobalMapDataDTO, userId: string) {
        const { bounds, category, limit, clustering } = query;

        const totalContributions = await this.environmentalContributionModel.aggregate([
            {
                $lookup: {
                    from: 'posts',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'post'
                }
            },
            {
                $unwind: '$post'
            },
            {
                $match: {
                    'post.postType': { $in: category === 'all' ? ['plantation', 'garbage_collection', 'water_ponds', 'rain_water'] : [category] },
                    'post.visibility': 'public'
                }
            },
            {
                $count: 'total'
            }
        ]);

        const totalCount = totalContributions[0]?.total || 0;

        if (totalCount === 0) {
            return { type: 'clustered', data: [] };
        }

        // 🔧 KEY CHANGE: Query individual EnvironmentalContribution documents (each = 1 element on map)
        const pipeline = [
            // Match contributions with location data
            {
                $match: {
                    'location.latitude': { $exists: true },
                    'location.longitude': { $exists: true }
                }
            },
            // Join with Post to get post type and visibility
            {
                $lookup: {
                    from: 'posts',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'post'
                }
            },
            {
                $unwind: '$post'
            },
            // Filter by category and visibility
            {
                $match: {
                    'post.postType': { $in: category === 'all' ? ['plantation', 'garbage_collection', 'water_ponds', 'rain_water'] : [category] },
                    'post.visibility': 'public'
                }
            },
            // Add bounds filtering if provided
            ...(bounds ? [{
                $match: {
                    'location.latitude': {
                        $gte: bounds.southWest.latitude,
                        $lte: bounds.northEast.latitude
                    },
                    'location.longitude': {
                        $gte: bounds.southWest.longitude,
                        $lte: bounds.northEast.longitude
                    }
                }
            }] : []),
            {
                $limit: limit || 500
            },
            {
                $project: {
                    _id: 1,
                    postType: '$post.postType',
                    location: 1,
                    projectName: '$post.projectDetails.name',
                    elementSummary: {
                        $switch: {
                            branches: [
                                {
                                    case: { $eq: ['$post.postType', 'plantation'] },
                                    then: {
                                        species: '$plantationData.species',
                                        type: '$plantationData.type',
                                        estimatedHeight: '$plantationData.estimatedHeight',
                                        isActive: '$plantationData.isActive'
                                    }
                                },
                                {
                                    case: { $eq: ['$post.postType', 'garbage_collection'] },
                                    then: {
                                        type: '$garbageCollectionData.type',
                                        capacity: '$garbageCollectionData.capacity',
                                        material: '$garbageCollectionData.material'
                                    }
                                },
                                {
                                    case: { $eq: ['$post.postType', 'water_ponds'] },
                                    then: {
                                        type: '$waterPondsData.type',
                                        purpose: '$waterPondsData.purpose',
                                        capacity: '$waterPondsData.capacity',
                                        estimatedDepth: '$waterPondsData.estimatedDepth'
                                    }
                                },
                                {
                                    case: { $eq: ['$post.postType', 'rain_water'] },
                                    then: {
                                        type: '$rainWaterData.type',
                                        capacity: '$rainWaterData.capacity',
                                        storageMethod: '$rainWaterData.storageMethod',
                                        estimatedVolume: '$rainWaterData.estimatedVolume'
                                    }
                                }
                            ],
                            default: {}
                        }
                    }
                }
            }
        ];

        const results = await this.environmentalContributionModel.aggregate(pipeline);

        // 🔧 CLUSTERING: Group nearby elements of the same type
        if (clustering && results.length > 50) {
            const clustered = this.clusterEnvironmentalElements(results, query.clusterRadius || 50);
            return {
                type: 'clustered',
                data: clustered
            };
        }

        return {
            type: 'individual', // Each marker = 1 tree/bin/pond/harvester
            data: results
        };
    }

    private clusterEnvironmentalElements(elements: any[], radiusKm: number = 50) {
        const clusters = [];
        const used = new Set();

        for (let i = 0; i < elements.length; i++) {
            if (used.has(i)) continue;

            const centerElement = elements[i];
            const cluster = {
                center: {
                    latitude: centerElement.location.latitude,
                    longitude: centerElement.location.longitude
                },
                postType: centerElement.postType,
                count: 1, // Count of individual elements (trees/bins/ponds)
                elements: [centerElement], // Individual environmental elements
                projectDetails: centerElement.projectDetails
            };

            // Find nearby elements of the same type
            for (let j = i + 1; j < elements.length; j++) {
                if (used.has(j)) continue;

                const distance = this.calculateDistance(
                    centerElement.location.latitude,
                    centerElement.location.longitude,
                    elements[j].location.latitude,
                    elements[j].location.longitude
                );

                // Cluster elements of same type that are close together
                if (distance <= radiusKm && elements[j].postType === centerElement.postType) {
                    cluster.count++;
                    cluster.elements.push(elements[j]);
                    used.add(j);
                }
            }

            clusters.push(cluster);
            used.add(i);
        }

        return clusters;
    }

    formatCounterDataToResponse(counters: any[]) {
        const data = {
            totalPosts: 0,
            totalElements: 0,
            categories: {
                plantation: { posts: 0, totalTrees: 0 },
                garbage_collection: { posts: 0, totalBins: 0 },
                water_ponds: { posts: 0, totalPonds: 0 },
                rain_water: { posts: 0, totalHarvesters: 0 }
            }
        };

        const elementCounterMap = {
            'plantation': 'totalTrees',
            'garbage_collection': 'totalBins',
            'water_ponds': 'totalPonds',
            'rain_water': 'totalHarvesters'
        };

        const projectCounterMap = {
            'plantation_projects': 'plantation',
            'garbage_collection_projects': 'garbage_collection',
            'water_ponds_projects': 'water_ponds',
            'rain_water_projects': 'rain_water'
        };

        counters.forEach(counter => {
            const count = counter.count || 0;
            const name = counter.name;

            if (elementCounterMap[name]) {
                const category = name;
                const elementField = elementCounterMap[name];

                data.categories[category][elementField] += count;
                data.totalElements += count;
            }

            else if (projectCounterMap[name]) {
                const category = projectCounterMap[name];

                data.categories[category].posts += count;
                data.totalPosts += count;
            }
        });


        return data;
    }

    async getGlobalMapCounts(query: GetGlobalMapCountsDTO) {
        const { bounds, country, city } = query;

        const data = await this.metricsAggregatorService.getGlobalEnvironmentalCounts()
        return this.formatCounterDataToResponse(data)
    }

    async searchGlobalMapLocations(query: SearchGlobalMapLocationsDTO) {
        const { query: searchQuery, category, limit } = query;

        // 🔧 UPDATED: Search individual elements and group by location
        const pipeline: any = [
            // Join with Post data
            {
                $lookup: {
                    from: 'posts',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'post'
                }
            },
            {
                $unwind: '$post'
            },
            // Filter by category and search criteria
            {
                $match: {
                    'post.postType': { $in: category === 'all' ? ['plantation', 'garbage_collection', 'water_ponds', 'rain_water'] : [category] },
                    'post.visibility': 'public',
                    $or: [
                        // Search in individual element locations
                        { 'location.address': { $regex: new RegExp(searchQuery, 'i') } },
                        { 'location.city': { $regex: new RegExp(searchQuery, 'i') } },
                        { 'location.country': { $regex: new RegExp(searchQuery, 'i') } },
                        // Also search in project details
                        { 'post.projectDetails.name': { $regex: new RegExp(searchQuery, 'i') } },
                        { 'post.projectDetails.description': { $regex: new RegExp(searchQuery, 'i') } }
                    ]
                }
            },
            // Group by city/country to show location-based results
            {
                $group: {
                    _id: {
                        city: '$location.city',
                        country: '$location.country'
                    },
                    elementCount: { $sum: 1 }, // Count of individual elements in this location
                    uniqueProjects: { $addToSet: '$postId' }, // Unique projects in this location
                    center: {
                        $first: {
                            latitude: '$location.latitude',
                            longitude: '$location.longitude'
                        }
                    },
                    sampleElements: {
                        $push: {
                            contributionId: '$_id',
                            postId: '$postId',
                            postType: '$post.postType',
                            location: '$location',
                            projectName: '$post.projectDetails.name'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    city: '$_id.city',
                    country: '$_id.country',
                    displayName: {
                        $concat: [
                            { $ifNull: ['$_id.city', ''] },
                            { $cond: { if: { $and: ['$_id.city', '$_id.country'] }, then: ', ', else: '' } },
                            { $ifNull: ['$_id.country', ''] }
                        ]
                    },
                    elementCount: 1, // Total individual elements in this location
                    projectCount: { $size: '$uniqueProjects' }, // Number of projects
                    center: 1,
                    sampleElements: { $slice: ['$sampleElements', 5] }
                }
            },
            { $sort: { elementCount: -1 } },
            { $limit: limit }
        ];

        const results = await this.environmentalContributionModel.aggregate(pipeline);

        return {
            results: results.map(result => ({
                ...result,
                count: result.elementCount, // For frontend compatibility
                description: `${result.elementCount} elements in ${result.projectCount} projects`
            })),
            total: results.length
        };
    }

    // 🔧 UPDATED: Get plantation elements due for updates (individual trees)
    async getPlantationElementsDue(targetDate: Date, stage: any) {
        const plantationElementsDue = await this.environmentalContributionModel.aggregate([
            {
                $match: {
                    'plantationData.isActive': true,
                    'plantationData.nextUpdateDue': {
                        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                        $lt: new Date(targetDate.setHours(23, 59, 59, 999))
                    }
                }
            },
            // Join with Post to get user info and project details
            {
                $lookup: {
                    from: 'posts',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'post'
                }
            },
            {
                $unwind: '$post'
            },
            // Check for existing notifications (per individual element)
            {
                $lookup: {
                    from: 'notificationlogs',
                    let: { contributionId: '$_id', stage: stage.stage },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$contributionId', { $toString: '$$contributionId' }] },
                                        { $eq: ['$stage', '$$stage'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'sentNotifications'
                }
            },
            {
                $match: {
                    'sentNotifications': { $size: 0 } // Only elements without this notification
                }
            },
            {
                $project: {
                    _id: 1,
                    postId: 1,
                    user: '$post.user',
                    projectName: '$post.projectDetails.name',
                    plantationData: 1,
                    location: 1, // Individual tree location
                    createdAt: 1,
                    media: 1 // Photos of this specific tree
                }
            }
        ]);

        return plantationElementsDue;
    }

    // Distance calculation helper (unchanged)
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private async getClusteredMapData(geoQuery: any, clusterRadius: number, limit: number) {
        const radiusInRadians = clusterRadius / 6371;

        const pipeline = [
            { $match: geoQuery },
            {
                $addFields: {
                    gridLat: {
                        $floor: {
                            $divide: ["$location.latitude", radiusInRadians * 180 / Math.PI]
                        }
                    },
                    gridLng: {
                        $floor: {
                            $divide: ["$location.longitude", radiusInRadians * 180 / Math.PI]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        postType: "$postType",
                        gridLat: "$gridLat",
                        gridLng: "$gridLng"
                    },
                    count: { $sum: 1 },
                    locations: {
                        $push: {
                            postId: "$_id",
                            location: "$location",
                            media: { $arrayElemAt: ["$media", 0] }, // First image for preview
                            plantationData: "$plantationData",
                            garbageCollectionData: "$garbageCollectionData",
                            waterPondsData: "$waterPondsData",
                            rainWaterData: "$rainWaterData",
                            createdAt: "$createdAt",
                            user: "$user"
                        }
                    },
                    // Calculate cluster center
                    centerLat: { $avg: "$location.latitude" },
                    centerLng: { $avg: "$location.longitude" }
                }
            },
            {
                $project: {
                    postType: "$_id.postType",
                    count: 1,
                    center: {
                        latitude: "$centerLat",
                        longitude: "$centerLng"
                    },
                    locations: { $slice: ["$locations", 10] },
                    _id: 0
                }
            },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'locations.user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            }
        ];

        const clusters = await this.postModel.aggregate(pipeline);

        return {
            type: 'clustered',
            data: clusters
        };
    }

    private async getIndividualMapData(geoQuery: any, limit: number) {
        const pipeline = [
            { $match: geoQuery },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $project: {
                    _id: 1,
                    postType: 1,
                    location: 1,
                    media: { $arrayElemAt: ["$media", 0] },
                    plantationData: 1,
                    garbageCollectionData: 1,
                    waterPondsData: 1,
                    rainWaterData: 1,
                    createdAt: 1,
                    user: { $arrayElemAt: ["$userDetails", 0] }
                }
            }
        ];

        const posts = await this.postModel.aggregate(pipeline);

        return {
            type: 'individual',
            data: posts
        };
    }

    async createElement(targetId: string, postType: string, data: CreateEnvironmentalContributionDTO) {
        const environmentalContribution = await this.environmentalContributionModel.create({ ...data, postId: new Types.ObjectId(data.postId) })

        // global contributions
        Promise.all([
            this.metricsAggregatorService.incrementCount(null, "global_environmental_contributions", 'contributions'),
            this.metricsAggregatorService.incrementCount(null, postType, "contributions"),
            this.metricsAggregatorService.incrementCount(null, postType, `${environmentalContribution.location.country}_country_contributions`),

            // user/page specific contributions
            this.metricsAggregatorService.incrementCount(new Types.ObjectId(targetId), postType, 'contributions')
        ])
        return environmentalContribution
    }


    async updateElement(elementId: string, data: UpdateEnvironmentalContributionDTO) {
        const environmentalContribution = await this.environmentalContributionModel.findByIdAndUpdate(
            elementId,
            {
                $set:
                {
                    updateHistory: data.updateHistory
                }
            })
        return environmentalContribution
    }

    async deleteElements(postId: string, postType: string, targetId: string) {
        const objectId = new Types.ObjectId(postId);

        const [elements, deleteResult] = await Promise.all([
            this.environmentalContributionModel.aggregate([
                { $match: { postId: objectId } }
            ]),
            this.environmentalContributionModel.deleteMany({ postId: objectId })
        ]);

        console.log(`Deleted ${deleteResult.deletedCount} elements from database`);

        if (elements.length > 0) {
            await this.cleanupElementFiles(elements);
            console.log('✅ Element files cleanup completed');
            await this.decrementElementCounts(elements, postType, targetId);
            return { deleteCount: deleteResult.deletedCount };
        }
        return null
    }

    async deleteElement(elementId: string, postType: string, targetId: string) {
        console.log(elementId, 'element id')
        const element = await this.environmentalContributionModel.findByIdAndDelete(elementId)

        if (element && element['media']) {
            console.log(`Deleted ${element} from database`);

            await this.cleanupElementFiles([element]);
            await this.decrementElementCounts([element], postType, targetId);
            console.log('✅ Element files cleanup completed');
            return true
        }

        return null;
    }
    private async decrementElementCounts(elements: any, postType: string, targetId: string) {
        const countryCounts = elements.reduce((acc, element) => {
            const country = element.location?.country;
            console.log(country)
            if (country) {
                acc[country] = (acc[country] || 0) + 1;
            }
            return acc;
        }, {});

        return Promise.all([
            this.metricsAggregatorService.decrementCount(null, "global_environmental_contributions", 'contributions', elements.length),
            this.metricsAggregatorService.decrementCount(null, postType, "contributions", elements.length),
            this.metricsAggregatorService.decrementCount(new Types.ObjectId(targetId), postType, 'contributions', elements.length),

            ...Object.entries(countryCounts).map(([country, count]) =>
                this.metricsAggregatorService.decrementCount(null, postType, `${country}_country_contributions`, count as number)
            )
        ]);
    }
    private async cleanupElementFiles(elements: any[]): Promise<void> {
        const filesToDelete = this.extractAllFilenames(elements);

        if (filesToDelete.length === 0) return;

        console.log(`🗑️ Processing ${filesToDelete.length} files for deletion`);

        if (filesToDelete.length <= 10) {
            await this.deleteFilesParallel(filesToDelete);
        } else if (filesToDelete.length <= 1000) {
            await this.uploadService.deleteMultipleFromS3(filesToDelete);
        } else {
            await this.deleteMultipleBatches(filesToDelete);
        }
    }

    private async deleteFilesParallel(filenames: string[]): Promise<void> {
        console.log('📤 Using parallel individual deletions');
        const deletePromises = filenames.map(filename =>
            this.uploadService.deleteFromS3(filename)
        );
        await Promise.allSettled(deletePromises);
    }

    private async deleteMultipleBatches(filenames: string[]): Promise<void> {
        console.log('🔄 Using multiple batch deletions');
        const batchSize = 1000;

        for (let i = 0; i < filenames.length; i += batchSize) {
            const batch = filenames.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(filenames.length / batchSize)}`);
            await this.uploadService.deleteMultipleFromS3(batch);
        }
    }

    private extractAllFilenames(elements: any[]): string[] {
        const filesToDelete: string[] = [];
        elements.forEach(element => {
            if (element.media?.length > 0) {
                element.media.forEach(mediaItem => {
                    if (typeof mediaItem.url === 'string') {
                        const filename = this.extractFilename(mediaItem.url);
                        if (filename) filesToDelete.push(filename);
                    }
                });
            }

            if (element?.updateHistory?.media?.length > 0) {
                element.updateHistory.media.forEach(mediaItem => {
                    if (typeof mediaItem.url === 'string') {
                        const filename = this.extractFilename(mediaItem.url);
                        if (filename) filesToDelete.push(filename);
                    }
                });
            }
        });

        return filesToDelete;
    }

    private extractFilename(url: string): string {
        const parts = url.split("/");
        return parts[parts.length - 1] || '';
    }

}
