import { forwardRef, Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from 'src/schema/comment';
import { JwtModule } from '@nestjs/jwt';
import { UploadModule } from 'src/upload/upload.module';
import { MetricsAggregatorModule } from 'src/metrics-aggregator/metrics-aggregator.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    JwtModule,
    UploadModule,
    forwardRef(() => MetricsAggregatorModule),
    NotificationModule,
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }])
  ],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule { }
