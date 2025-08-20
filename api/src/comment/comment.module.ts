import { forwardRef, Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from 'src/schema/comment';
import { JwtModule } from '@nestjs/jwt';
import { UploadModule } from 'src/upload/upload.module';
import { MetricsAggregatorModule } from 'src/metrics-aggregator/metrics-aggregator.module';
import { NotificationModule } from 'src/notification/notification.module';
import { HashtagModule } from 'src/hashtag/hashtag.module';
import { PostsModule } from 'src/posts/posts.module';
import { FollowerModule } from 'src/follower/follower.module';

@Module({
  imports: [
    JwtModule,
    UploadModule,
    forwardRef(() => MetricsAggregatorModule),
    NotificationModule,
    HashtagModule,
    forwardRef(() => PostsModule),
    FollowerModule,
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }])
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService]
})
export class CommentModule { }
