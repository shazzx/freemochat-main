import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from 'src/schema/post';
import { Report } from 'src/schema/report';
import { Types } from 'mongoose'
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
    private readonly uploadService: UploadService
  ) { }

  async getPosts(cursor: string, search: string) {
    let limit = 50
    const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};


    // const query = search
    //   ? { _id: new Types.ObjectId(search), ..._cursor }
    //   : _cursor;

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

      const posts = await this.postModel.aggregate([
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
          }
        },

        {
          $project: {
            _id: 1,
            content: 1,
            media: 1,
            user: 1,
            target: 1,
            targetId: 1,
            type: 1,
            updatedAt: 1,
            createdAt: 1,
          },
        },
      ]);


      const hasNextPage = posts.length > limit
      const _posts = hasNextPage ? posts.slice(0, -1) : posts
      const nextCursor = hasNextPage ? _posts[_posts.length - 1].createdAt.toISOString() : null
      const results = { posts: _posts, nextCursor };
      return results
    } catch (error) {
      return { posts: [], nextCursor: null }
    }
  }

  async deletePost(postDetails: { postId: string, media: { url: string } }) {
    if (postDetails.media) {
      const { media } = postDetails
      for (let image in media) {
        let imageUrlSplit = media[image].url.split("/")
        let filename = imageUrlSplit[imageUrlSplit.length - 1]
        let deleted = await this.uploadService.deleteFromS3(filename)
      }
    }

    const post = await this.postModel.findByIdAndDelete(postDetails.postId)
    return post
  }

  async getReports() {
    return await this.reportModel.find()
  }
}
