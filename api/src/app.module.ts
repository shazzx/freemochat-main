import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from './upload/upload.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { PostsModule } from './posts/posts.module';
import { SearchModule } from './search/search.module';
import { PagesModule } from './pages/pages.module';
import { CGroupsModule } from './cgroups/cgroups.module';
import { GroupsModule } from './groups/groups.module';
import { AdminModule } from './admin/admin.module';
import { StoriesModule } from './stories/stories.module';
import { MessageModule } from './message/message.module';
import { ChatlistModule } from './chatlist/chatlist.module';
import { AgoraModule } from './agora/agora.module';
import { NotificationModule } from './notification/notification.module';
import { MediaModule } from './media/media.module';
import { CacheModule } from './cache/cache.module';
import { SnsModule } from './sns/sns.module';
import { OtpModule } from './otp/otp.module';
import { FollowerModule } from './follower/follower.module';
import { MemberModule } from './member/member.module';
import { FriendModule } from './friend/friend.module';
import { CommentModule } from './comment/comment.module';
import { AccountManagementModule } from './account-management/account-management.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { MetricsAggregatorModule } from './metrics-aggregator/metrics-aggregator.module';
import { BackgroundjobsModule } from './backgroundjobs/backgroundjobs.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { MediaConsumerModule } from './media-consumer/media-consumer.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UploadListener } from './posts/upload.listener';
import { ChatGateway } from './chat/chat.gateway';
import { ChatModule } from './chat/chat.module';
import { EncryptionModule } from './encryption/encryption.module';
import { CryptoModule } from './crypto/crypto.module';
import { TwilioModule } from './twilio/twilio.module';
import { LocationModule } from './location/location.module';
import { PaymentModule } from './payment/payment.module';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: "localhost",
        port: 6379
      }
    }),
    EventEmitterModule.forRoot(),
    UserModule,
    UploadModule,
    PostsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    // MongooseModule.forRoot("mongodb://192.168.56.1:27017/freedombook"),
    MongooseModule.forRoot("mongodb://localhost:27017/freedombook-prod2"),
    StoriesModule,
    SearchModule,
    PagesModule,
    CGroupsModule,
    GroupsModule,
    AdminModule,
    MessageModule,
    ChatlistModule,
    AgoraModule,
    NotificationModule,
    MediaModule,
    CacheModule,
    AuthModule,
    SnsModule,
    OtpModule,
    FollowerModule,
    MemberModule,
    FriendModule,
    CommentModule,
    JwtModule,
    AccountManagementModule,
    MetricsAggregatorModule,
    BackgroundjobsModule,
    MediaConsumerModule,
    ChatModule,
    EncryptionModule,
    CryptoModule,
    TwilioModule,
    LocationModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: "APP_GUARD", useClass: JwtAuthGuard }, UploadListener],
})
export class AppModule { }
