import { forwardRef, Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/schema/post';
import { JwtModule } from '@nestjs/jwt';
import { Comment, CommentSchema } from 'src/schema/comment';
import { Report, ReportSchema } from 'src/schema/report';
import { Promotion, promotionSchema } from 'src/schema/promotion';
import { NotificationModule } from 'src/notification/notification.module';
import { ChatModule } from 'src/chat/chat.module';
import { CacheModule } from 'src/cache/cache.module';
import { Like, LikeSchema } from 'src/schema/likes';
import { Bookmark, BookmarkSchema } from 'src/schema/bookmark';
import { ViewedPosts, ViewedPostsSchema } from 'src/schema/viewedPosts';
import { UploadModule } from 'src/upload/upload.module';
import { MediaModule } from 'src/media/media.module';
import { MetricsAggregatorModule } from 'src/metrics-aggregator/metrics-aggregator.module';
import { BullModule } from '@nestjs/bullmq';
import { UploadListener } from './upload.listener';
import FollowerSchema, { Follower } from 'src/schema/followers';
import MemberSchema, { Member } from 'src/schema/members';

@Module({
  imports: [UserModule, JwtModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Promotion.name, schema: promotionSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Bookmark.name, schema: BookmarkSchema },
      { name: ViewedPosts.name, schema: ViewedPostsSchema },
      { name: Follower.name, schema: FollowerSchema },
      { name: Member.name, schema: MemberSchema },
    ]),

    BullModule.registerQueue({
      name: "media-upload"
    }),
    MediaModule,
    MetricsAggregatorModule,
    CacheModule,
    NotificationModule,
    ChatModule,
    UploadModule
  ],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService]
})
export class PostsModule { }
