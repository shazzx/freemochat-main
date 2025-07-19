import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Hashtag } from 'src/schema/hashtag';
import { Post } from 'src/schema/post';

@Injectable()
export class HashtagService {
  constructor(
    @InjectModel(Hashtag.name) private hashtagModel: Model<Hashtag>,
    @InjectModel(Post.name) private postModel: Model<Post>,
  ) { }

  // Extract hashtags from text content
  extractHashtags(content: string): string[] {
    if (!content) return [];

    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const hashtags = [];
    let match;

    while ((match = hashtagRegex.exec(content)) !== null) {
      const hashtag = match[1].toLowerCase();
      if (hashtag && !hashtags.includes(hashtag)) {
        hashtags.push(hashtag);
      }
    }

    return hashtags;
  }

  // Create or update hashtags when a post is created/updated
  async processPostHashtags(postId: Types.ObjectId, hashtags: string[]): Promise<string[]> {

    if (hashtags.length === 0) return [];

    const postObjectId = new Types.ObjectId(postId);
    const processedHashtags = [];

    for (const hashtagName of hashtags) {
      let hashtag = await this.hashtagModel.findOne({ name: hashtagName });

      if (!hashtag) {
        hashtag = new this.hashtagModel({
          name: hashtagName,
          displayName: hashtagName,
          usageCount: 1,
          // postsCount: 1,
          lastUsed: new Date(),
          posts: [postObjectId],
          isActive: true
        });
      } else {
        // hashtag.usageCount += 1;
        hashtag.lastUsed = new Date();

        if (!hashtag.posts.includes(postObjectId)) {
          hashtag.usageCount += 1;
          hashtag.posts.push(postObjectId);
        }
      }

      await hashtag.save();
      processedHashtags.push(hashtagName);
    }

    return processedHashtags;
  }

  async removePostHashtags(postId: string, hashtags: string[]): Promise<void> {
    if (!hashtags || hashtags.length === 0) return;

    const postObjectId = new Types.ObjectId(postId);

    for (const hashtagName of hashtags) {
      const hashtag = await this.hashtagModel.findOne({ name: hashtagName });

      if (hashtag) {
        hashtag.posts = hashtag.posts.filter(id => !id.equals(postObjectId));
        hashtag.usageCount = Math.max(0, hashtag.usageCount - 1);

        if (hashtag.posts.length === 0) {
          hashtag.isActive = false;
        }

        await hashtag.save();
      }
    }
  }

  // Get trending hashtags
  async getTrendingHashtags(limit: number = 10): Promise<Hashtag[]> {
    return this.hashtagModel
      .find({ isActive: true, usageCount: { $gt: 0 } })
      .sort({ usageCount: -1, lastUsed: -1 })
      .limit(limit)
      .exec();
  }

  // Search hashtags
  async searchHashtags(query: string, limit: number = 10, skip: number = 0): Promise<Hashtag[]> {
    const searchRegex = new RegExp(query.replace('#', ''), 'i');

    return this.hashtagModel
      .find({
        $and: [
          { isActive: true },
          { usageCount: { $gt: 0 } },
          {
            $or: [
              { name: searchRegex },
              { displayName: searchRegex }
            ]
          }
        ]
      })
      .sort({ usageCount: -1, lastUsed: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  // Get posts by hashtag
  async getPostsByHashtag(
    hashtagName: string,
    userId: string,
    limit: number = 10,
    cursor?: string
  ): Promise<any> {
    const hashtag = await this.hashtagModel.findOne({
      name: hashtagName.toLowerCase().replace('#', ''),
      isActive: true
    });

    if (!hashtag) {
      return {
        posts: [],
        nextCursor: null,
        hasMore: false
      };
    }

    // Build query for posts
    let query: any = {
      _id: { $in: hashtag.posts },
      $or: [
        { visibility: 'public' },
        { $and: [{ visibility: 'private' }, { user: new Types.ObjectId(userId) }] }
      ]
    };

    // Add cursor pagination
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Create aggregation pipeline similar to the feed
    const pipeline: any = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $limit: limit + 1 },

      // User lookup
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

      // Target lookup (users, groups, pages)
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

      // Mentions lookup
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

      // Likes lookup
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
                    { $eq: ['$type', 'post'] }
                  ]
                }
              }
            }
          ],
          as: 'userLike'
        }
      },

      // Bookmarks lookup
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
                    { $eq: ['$userId', new Types.ObjectId(userId)] }
                  ]
                }
              }
            }
          ],
          as: 'userBookmark'
        }
      },

      // Counters lookup
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

      // Shared post lookup (if needed)
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
            }
          ],
          as: 'sharedPostDetails'
        }
      },

      // Format the response
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
          isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
          reaction: { $arrayElemAt: ['$userLike.reaction', 0] },
          isBookmarkedByUser: { $gt: [{ $size: '$userBookmark' }, 0] },
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
          sharedPost: {
            $cond: {
              if: { $gt: [{ $size: '$sharedPostDetails' }, 0] },
              then: { $arrayElemAt: ['$sharedPostDetails', 0] },
              else: null
            }
          }
        }
      },

      // Final projection
      {
        $project: {
          _id: 1,
          content: 1,
          media: 1,
          user: 1,
          target: 1,
          mentions: 1,
          hashtags: 1,
          postType: 1,
          type: 1,
          targetId: 1,
          location: 1,
          plantationData: 1,
          isLikedByUser: 1,
          reaction: 1,
          isBookmarkedByUser: 1,
          likesCount: { $ifNull: ['$likesCount.count', 0] },
          commentsCount: { $ifNull: ['$commentsCount.count', 0] },
          sharesCount: { $ifNull: ['$sharesCount.count', 0] },
          videoViewsCount: { $ifNull: ['$videoViewsCount.count', 0] },
          bookmarksCount: { $ifNull: ['$bookmarksCount.count', 0] },
          sharedPost: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    const posts = await this.postModel.aggregate(pipeline);

    // Handle pagination
    const hasMore = posts.length > limit;
    const resultPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? resultPosts[resultPosts.length - 1].createdAt.toISOString() : null;

    return {
      posts: resultPosts,
      nextCursor,
      hasMore
    };
  }

  // Get hashtag by name
  async getHashtagByName(name: string): Promise<Hashtag | null> {
    return this.hashtagModel.findOne({
      name: name.toLowerCase().replace('#', ''),
      isActive: true
    });
  }

  // Get hashtag statistics
  async getHashtagStats(): Promise<any> {
    const [totalHashtags, activeHashtags, topHashtags] = await Promise.all([
      this.hashtagModel.countDocuments(),
      this.hashtagModel.countDocuments({ isActive: true }),
      this.hashtagModel.find({ isActive: true }).sort({ usageCount: -1 }).limit(5)
    ]);

    return {
      totalHashtags,
      activeHashtags,
      topHashtags
    };
  }
}