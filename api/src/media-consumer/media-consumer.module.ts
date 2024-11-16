import { forwardRef, Module } from '@nestjs/common';
import { MediaUploadConsumer } from './media-consumer.service';
import { PostsModule } from 'src/posts/posts.module';
import { UploadModule } from 'src/upload/upload.module';
import { MediaModule } from 'src/media/media.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [forwardRef(() => PostsModule), UploadModule, MediaModule, BullModule.registerQueue({name: "media-upload"})],
  providers: [MediaUploadConsumer],
  exports: [MediaUploadConsumer]
})
export class MediaConsumerModule {}
