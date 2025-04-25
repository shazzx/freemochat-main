// search.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group } from 'src/schema/group';
import { Page } from 'src/schema/pages';
import { Post } from 'src/schema/post';
import { User } from 'src/schema/user';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Group.name) private groupModel: Model<Group>,
    @InjectModel(Page.name) private pageModel: Model<Page>,
    @InjectModel(Post.name) private postModel: Model<Post>,
  ) { }

  async search(query: string, type = 'all', limit = 5, skip = 0) {
    console.log(`Search request: query=${query}, type=${type}, limit=${limit}, skip=${skip}`);

    if (type !== 'all') {
      return this.searchByType(type, query, limit, skip);
    }

    // For "all" type search
    const [users, groups, pages, posts] = await Promise.all([
      this.userModel.find({ username: { $regex: query, $options: 'i' } }).limit(limit).skip(skip).exec(),
      this.groupModel.find({ handle: { $regex: query, $options: 'i' } }).limit(limit).skip(skip).exec(),
      this.pageModel.find({ handle: { $regex: query, $options: 'i' } }).limit(limit).skip(skip).exec(),
      this.postModel.find({ content: { $regex: query, $options: 'i' } }).limit(limit).skip(skip).exec(),
    ]);

    console.log(`Search results count: ${JSON.stringify({
      users: users.length,
      groups: groups.length,
      pages: pages.length,
      posts: posts.length
    })}`);

    return { users, groups, pages, posts };
  }

  private async searchByType(type: string, query: string, limit: number, skip: number) {
    switch (type) {
      case 'users':
        return {
          users: await this.userModel.find({
            username: { $regex: query, $options: 'i' }
          }).limit(limit).skip(skip).exec()
        };
      case 'groups':
        return {
          groups: await this.groupModel.find({
            handle: { $regex: query, $options: 'i' }
          }).limit(limit).skip(skip).exec()
        };
      case 'pages':
        return {
          pages: await this.pageModel.find({
            handle: { $regex: query, $options: 'i' }
          }).limit(limit).skip(skip).exec()
        };
      case 'posts':
        return {
          posts: await this.postModel.find({
              content: { $regex: query, $options: 'i' }
            }).limit(limit).skip(skip).exec()
        };
    }
  }
}