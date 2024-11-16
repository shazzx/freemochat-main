import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MediaService } from 'src/media/media.service';
import { PostsService } from 'src/posts/posts.service';
import { UploadService } from 'src/upload/upload.service';
import { getFileType } from 'src/utils/getFileType';
import {v4 as uuidv4} from 'uuid'
import { Types} from 'mongoose'
import { OnQueueEvent } from '@nestjs/bullmq';

@Processor('media-upload')
export class MediaUploadConsumer {
  constructor(
    private readonly postsService: PostsService,
    private readonly uploadService: UploadService,
    private readonly mediaService: MediaService
  ) {}

  @OnQueueEvent('active')
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  @Process("media")
  async uploadMedia(job: Job<{ postId: string; files: Express.Multer.File[], targetId: Types.ObjectId }>) {
    const { postId, files, targetId } = job.data;
    console.log('ths is queue bro')
    try {
        let media = {
            images: [],
            videos: []
        }
        let postMedia = []

       await Promise.all(
        files.map(file => 
            {

            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            console.log(file)
                let uploaded = this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
                console.log(uploaded)
                if (fileType == 'video') {
                    media.videos.push(uploaded)
                    postMedia.push({ type: 'video', url: uploaded })
                }
                if (fileType == 'image') {
                    media.images.push(uploaded)
                    postMedia.push({ type: 'image', url: uploaded })
                }
            }
      ));
     const postDetails =  {media: postMedia, isUploaded: true} 
     console.log(postDetails, postId, targetId, 'meda upload consumer')
      await this.postsService.updatePost(postId, postDetails);
      await this.mediaService.storeMedia(targetId, media)
    } catch (error) {
      console.error(`Error uploading media for post ${postId}:`, error);
      await this.postsService.deletePost(postId);
    }
  }
}