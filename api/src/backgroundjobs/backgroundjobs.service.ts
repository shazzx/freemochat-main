import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Story } from 'src/schema/story';

@Injectable()
export class BackgroundjobsService {
    constructor(@InjectModel(Story.name) private storyModel: Model<Story>) {}

    @Cron(CronExpression.EVERY_30_MINUTES)
    async removeOldStories() {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const stories = await this.storyModel.deleteMany({ createdAt: { $lt: twentyFourHoursAgo } });
      console.log(stories)

    }
}
