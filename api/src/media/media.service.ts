import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Media } from 'src/schema/media';
import { Model, Types } from 'mongoose';

@Injectable()
export class MediaService {
  constructor(@InjectModel(Media.name) private mediaModel: Model<Media>) { }

  async storeMedia(targetId: Types.ObjectId, media: { images: string[], videos: string[] }) {
    let mediaExists = await this.mediaModel.findOne({ targetId })

    if (!mediaExists) {
      let _media = await this.mediaModel.create({ targetId, images: media.images, videos: media.videos })
      return _media
    }

    if (media.images) {
      mediaExists.images.push(...media.images)
    }

    if (media.videos) {
      mediaExists.videos.push(...media.videos)
    }
    mediaExists.save()
    return mediaExists

  }

  async removeMedia(targetId: Types.ObjectId, media: { images: string[], videos: string[] }) {

    const _media = await this.mediaModel.updateOne(
      { targetId },
      {
        $pull: {
            videos: {$in: media.videos},
            images: {$in: media.images}
        }
      })

      if(_media.modifiedCount > 0){
      console.log('media deleted from profile media')
      }
      return _media
  }

  async getMedia(targetId: string) {
    const media = await this.mediaModel.findOne({ targetId: new Types.ObjectId(targetId) })
    console.log(media)
    return media
  }
}
