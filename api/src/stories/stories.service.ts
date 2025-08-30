import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, } from 'mongoose';
import { FriendService } from 'src/friend/friend.service';
import { NotificationService } from 'src/notification/notification.service';
import { Story } from 'src/schema/story';
import { ViewedStories } from 'src/schema/viewedStories';

@Injectable()
export class StoriesService {

    constructor(
        @InjectModel(Story.name) private readonly storyModel: Model<Story>,
        @InjectModel(ViewedStories.name) private readonly viewedStoriesModel: Model<ViewedStories>,
        private readonly friendService: FriendService,
        private readonly notificationService: NotificationService
    ) { }

    async getStories(userId: string, username: string) {
        const friendIds = await this.friendService.getFriends(userId, true);
        const currentUserObjectId = new Types.ObjectId(userId);

        const stories = await this.storyModel.aggregate([
            {
                $match: {
                    user: { $in: [currentUserObjectId, ...friendIds] }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$user',
                    stories: {
                        $push: {
                            _id: '$_id',
                            url: '$url',
                            createdAt: '$createdAt',
                            user: '$user',
                            isLiked: {
                                $in: [currentUserObjectId, '$likedBy']
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 0,
                    user: '$user',
                    stories: 1
                }
            }
        ]);

        return stories;
    }

    async likeStory(storyId: string, userId: string) {
        try {
            const userObjectId = new Types.ObjectId(userId);
            const storyObjectId = new Types.ObjectId(storyId);

            const story = await this.storyModel.findById(storyObjectId, { likedBy: 1, user: 1 });

            if (!story) {
                throw new Error('Story not found');
            }

            const isAlreadyLiked = story.likedBy.some(id => id.toString() === userObjectId.toString());

            if (isAlreadyLiked) {
                return {
                    success: true,
                    isLiked: true,
                    message: 'Story already liked',
                    alreadyLiked: true
                };
            }

            await this.storyModel.findByIdAndUpdate(
                storyObjectId,
                { $addToSet: { likedBy: userObjectId } },
                {
                    new: true,
                    select: 'likedBy',
                    runValidators: true
                }
            );

            await this.notificationService.createNotification(
                {
                    from: new Types.ObjectId(userId),
                    user: new Types.ObjectId(String(story.user)),
                    targetId: new Types.ObjectId(userId),
                    type: "story",
                    postType: null,
                    targetType: 'user',
                    value: 'has liked your story'
                }
            )

            return {
                success: true,
                isLiked: true,
                message: 'Story liked successfully',
                alreadyLiked: false
            };

        } catch (error) {
            throw new Error(`Error liking story: ${error.message}`);
        }
    }

    async viewStory(storyId, userId) {
        const story = await this.storyModel.findById(storyId)

        if (story.user == userId) {
            return null
        }

        const alreadyViewed = await this.viewedStoriesModel.findOne({ storyId: new Types.ObjectId(storyId), userId: new Types.ObjectId(userId) })

        if (alreadyViewed) {
            console.log('story already viewed')
            return null
        }

        try {
            const storyViewed = await this.viewedStoriesModel.create({ storyId: new Types.ObjectId(storyId), userId: new Types.ObjectId(userId) })
            return storyViewed

        } catch (error) {
            if (error.name == "MongoServerError" && error.code == 11000) {
                return null
            }

            throw new BadRequestException()
        }
    }

    async getStoryViewes(storyId) {
        const storyViews = await this.viewedStoriesModel.find({ storyId: new Types.ObjectId(storyId) }).populate('userId')
        return storyViews
    }

    async getStoryLikes(storyId: string) {
        try {
            const storyObjectId = new Types.ObjectId(storyId);
            const result = await this.storyModel.aggregate([
                {
                    $match: { _id: storyObjectId }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'likedBy',
                        foreignField: '_id',
                        as: 'likedUsers',
                        pipeline: [
                            {
                                $project: {
                                    username: 1,
                                    profile: 1,
                                    _id: 1,
                                    isVerified: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        likes: '$likedUsers',
                        count: { $size: '$likedUsers' },
                        createdAt: 1
                    }
                }
            ]);

            if (!result || result.length === 0) {
                throw new Error('Story not found');
            }

            const storyData = result[0];

            return {
                likes: storyData.likes,
                count: storyData.count,
            };

        } catch (error) {
            throw new Error(`Error fetching story likes: ${error.message}`);
        }
    }

    async createStory(userId, storyDetails) {
        const story = await this.storyModel.create({ url: storyDetails.url, user: new Types.ObjectId(userId) })
        return story
    }

    async deleteStory(storyId: string, userId) {
        const deletedStory = await this.storyModel.findOneAndDelete({ _id: new Types.ObjectId(storyId), user: new Types.ObjectId(userId) })

        if (!deletedStory) {
            throw new BadRequestException('Story not found or you do not have permission to delete it.');
        }

        return deletedStory
    }
}
