import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FriendService } from 'src/friend/friend.service';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { Counter } from 'src/schema/Counter';
import { Story } from 'src/schema/story';
import { ViewedStories } from 'src/schema/viewedStories';
import { UserService } from 'src/user/user.service';

@Injectable()
export class StoriesService {

    constructor(
        @InjectModel(Story.name) private readonly storyModel: Model<Story>,
        @InjectModel(ViewedStories.name) private readonly viewedStoriesModel: Model<ViewedStories>,
        private readonly userService: UserService,
        private readonly metricsAggregatorService: MetricsAggregatorService,
        private readonly friendService: FriendService
    ) { }


    async getStories(userId: string, username: string) {
        const friendIds = await this.friendService.getFriends(userId, true)
        console.log(friendIds)
        console.log(await this.storyModel.find())
        const stories = await this.storyModel.aggregate([
            {
                $match: {
                    user: { $in: [new Types.ObjectId(userId), ...friendIds] }
                    // user: { $in: [new Types.ObjectId(userId), ...friendIds] }
                }
            },
            {
                $sort: { createdAt: -1 } // Sort by createdAt in descending order
            },
            {
                $group: {
                    _id: '$user',
                    stories: { $push: '$$ROOT' }
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

        return stories
    }

    async viewStory(storyId, userId) {
        const storyViewed = await this.viewedStoriesModel.create({ storyId: new Types.ObjectId(storyId), userId: new Types.ObjectId(userId) })
        console.log(storyViewed)
        return storyViewed
    }

    async getStoryViewes(storyId) {
        const storyViews = await this.viewedStoriesModel.find({ storyId }).populate('userId')
        return storyViews
    }

    async createStory(userId, storyDetails) {
        const story = await this.storyModel.create({ url: storyDetails.url, user: new Types.ObjectId(userId) })
        return story
    }


    // async updateStory(username: string, storyDetails: any) {
    //     let user: any = await this.userService.getUser(username)
    //     let storyIndex = user.stories.findIndex(story => story.id === storyDetails.id)
    //     if (storyIndex == -1) {
    //         throw new BadRequestException()
    //     }

    //     user.stories[storyIndex].title = storyDetails.title

    //     this.userService.updateUser(username, user)

    //     return user.stories[storyIndex]
    // }


    async deleteStory(storyId: string, userId) {
        const deletedStory = await this.storyModel.findOneAndDelete({ _id: new Types.ObjectId(storyId), user: new Types.ObjectId(userId) })

        if (!deletedStory) {
            throw new BadRequestException('Story not found or you do not have permission to delete it.');
        }

        return deletedStory
    }
}
