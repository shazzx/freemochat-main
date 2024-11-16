import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from 'src/schema/media';

@Module({
  imports: [UserModule, MongooseModule.forFeature([{name: Media.name, schema: MediaSchema}])],
  providers: [UploadService],
  exports: [UploadService]
})
export class UploadModule { }
