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


    // async getStories(userId: string, username: string) {
    //     const friendIds = await this.friendService.getFriends(userId, true)
    //     console.log(friendIds, 'user friends stories')
    //     const stories = await this.storyModel.aggregate([
    //         {
    //             $match: {
    //                 user: { $in: [new Types.ObjectId(userId), ...friendIds] }
    //                 // user: { $in: [new Types.ObjectId(userId), ...friendIds] }
    //             }
    //         },
    //         {
    //             $sort: { createdAt: -1 } // Sort by createdAt in descending order
    //         },
    //         {
    //             $group: {
    //                 _id: '$user',
    //                 stories: { $push: '$$ROOT' }
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: 'users',
    //                 localField: '_id',
    //                 foreignField: '_id',
    //                 as: 'user'
    //             }
    //         },
    //         {
    //             $unwind: '$user'
    //         },
    //         {
    //             $project: {
    //                 _id: 0,
    //                 user: '$user',
    //                 stories: 1
    //             }
    //         }
    //     ]);

    //     return stories
    // }

    // async getStories(userId: string, username: string) {
    //     const friendIds = await this.friendService.getFriends(userId, true);
    //     console.log(friendIds, 'user friends stories');

    //     const currentUserObjectId = new Types.ObjectId(userId);

    //     const stories = await this.storyModel.aggregate([
    //         {
    //             $match: {
    //                 user: { $in: [currentUserObjectId, ...friendIds] }
    //             }
    //         },
    //         {
    //             $addFields: {
    //                 // Check if current user liked this story
    //                 isLiked: {
    //                     $in: [currentUserObjectId, '$likedBy']
    //                 }
    //             }
    //         },
    //         {
    //             $sort: { createdAt: -1 } // Sort by createdAt in descending order
    //         },
    //         {
    //             $group: {
    //                 _id: '$user',
    //                 stories: { $push: '$ROOT' }
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: 'users',
    //                 localField: '_id',
    //                 foreignField: '_id',
    //                 as: 'user'
    //             }
    //         },
    //         {
    //             $unwind: '$user'
    //         },
    //         {
    //             $project: {
    //                 _id: 0,
    //                 user: '$user',
    //                 stories: {
    //                     $map: {
    //                         input: '$stories',
    //                         as: 'story',
    //                         in: {
    //                             _id: '$story._id',
    //                             url: '$story.url',
    //                             createdAt: '$story.createdAt',
    //                             user: '$story.user',
    //                             isLiked: '$story.isLiked'
    //                             // Explicitly exclude likedBy array and no likeCount
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     ]);

    //     return stories;
    // }

    // Alternative approach - even cleaner
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

            const updatedStory = await this.storyModel.findByIdAndUpdate(
                storyObjectId,
                { $addToSet: { likedBy: userObjectId } },
                {
                    new: true,
                    select: 'likedBy',
                    runValidators: true
                }
            );

            console.log('story liked', story, new Types.ObjectId(String(story.user)))

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

        console.log(story, storyId, 'inside view story method')
        if (story.user == userId) {
            console.log('return null')
            return null
        }

        const alreadyViewed = await this.viewedStoriesModel.findOne({ storyId: new Types.ObjectId(storyId), userId: new Types.ObjectId(userId) })

        console.log(alreadyViewed, storyId, userId)

        if (alreadyViewed) {
            console.log('story already viewed')
            return null
        }

        try {
            console.log("story viewed")
            const storyViewed = await this.viewedStoriesModel.create({ storyId: new Types.ObjectId(storyId), userId: new Types.ObjectId(userId) })
            console.log(storyViewed, 'storyviewed code below')
            return storyViewed

        } catch (error) {
            console.log('this is error', error)
            if (error.name == "MongoServerError" && error.code == 11000) {
                return null
            }

            throw new BadRequestException()
        }
    }

    async getStoryViewes(storyId) {
        console.log(storyId, 'viewed stories storyid')
        const storyViews = await this.viewedStoriesModel.find({ storyId: new Types.ObjectId(storyId) }).populate('userId')
        console.log('viewed stories list', storyViews)
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
