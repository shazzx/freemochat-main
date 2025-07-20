import { forwardRef, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, notificationSchema } from 'src/schema/Notification';
import { ChatModule } from 'src/chat/chat.module';
import { NotificationController } from './notification.controller';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { MetricsAggregatorModule } from 'src/metrics-aggregator/metrics-aggregator.module';
import { PostsModule } from 'src/posts/posts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: notificationSchema }]),
    ChatModule,
    MetricsAggregatorModule,
    AuthModule,
    JwtModule,
    forwardRef(() => PostsModule)
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule { }
