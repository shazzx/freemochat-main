import { forwardRef, Module } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { UserModule } from 'src/user/user.module';
import { StoriesController } from './stories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Story, StorySchema } from 'src/schema/story';
import { JwtModule } from '@nestjs/jwt';
import { FriendModule } from 'src/friend/friend.module';
import { UploadModule } from 'src/upload/upload.module';
import counterSchema, { Counter } from 'src/schema/Counter';
import { MetricsAggregatorModule } from 'src/metrics-aggregator/metrics-aggregator.module';
import { ViewedStories, ViewedStoriesSchema } from 'src/schema/viewedStories';

@Module({
  imports: [FriendModule, forwardRef(() => UploadModule), MetricsAggregatorModule, UserModule, JwtModule, MongooseModule.forFeature([{ name: Story.name, schema: StorySchema }, { name: ViewedStories.name, schema: ViewedStoriesSchema }])],
  providers: [StoriesService],
  controllers: [StoriesController]
})
export class StoriesModule { }
