import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/schema/post';
import { Report, ReportSchema } from 'src/schema/report';
import { JwtModule } from '@nestjs/jwt';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [JwtModule, UploadModule, MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }, { name: Report.name, schema: ReportSchema }])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule { }
