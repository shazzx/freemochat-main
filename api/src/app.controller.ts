import { BadRequestException, Body, Controller, Get, ParseFilePipe, Post, Req, Request, Res, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload/upload.service';
import { ObjectId } from 'mongoose';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { v4 as uuidv4 } from 'uuid'

@Controller()
export class AppController {

  constructor(private readonly uploadService: UploadService) { }

  @Post("/upload/single")
  @UseInterceptors(FileInterceptor("file"))
  // async uploadSingle(@UploadedFile(new ParseFilePipe({

  // })) file: Express.Multer.File, @Body("data") body: any) {
  //   const { details } = JSON.parse(body) as { details: { username: string, userId: ObjectId, type: String } }
  //   console.log(details)
  //   if (details?.type == 'story') {
  //     let uploaded = await this.uploadService.uploadFile(uuidv4(), file.buffer)
  //     return uploaded
  //   }

  //   if(details?.type  == 'profile' || details?.type == 'cover'){
  //     console.log(file, details)
  //     let uploaded = await this.uploadService.uploadFile(uuidv4(), file.buffer)
  //     return uploaded
  //   }

  //   console.log('below profile')

  //   let media = {
  //     images: [],
  //     videos: []
  //   }

  //   let postMedia = []

  //   const fileType = this.getFileType(file.mimetype)
  //   let uploaded = await this.uploadService.uploadFile(uuidv4(), file.buffer)
  //   if (fileType == 'video') {
  //     media.videos.push(uploaded)
  //     postMedia.push({ type: 'video', url: uploaded })
  //   }
  //   if (fileType == 'image') {
  //     media.images.push(uploaded)
  //     postMedia.push({ type: 'image', url: uploaded })
  //   }

  //   try {
  //     await this.uploadService.storeMedia(details, media)
  //     return postMedia
  //   } catch (error) {
  //     console.log(error)
  //     return new BadRequestException()
  //   }
  // }

  @Post("/upload")
  @UseInterceptors(FilesInterceptor("files"))
  async uploadFile(@UploadedFiles(new ParseFilePipe({
    // validators: [
    // ]
  })) files: Array<Express.Multer.File>, @Body("data") body: any) {
    // let media = {
    //   images: [],
    //   videos: []
    // }

    // let postMedia = []
    // const { details } = JSON.parse(body) as { details: { username: string, userId: ObjectId, type: String } }

    // if (details.type == "profiles") {
    //   const profiles = {profile: null, cover: null}
    //   for (let file of files) {
    //     let uploaded = await this.uploadService.uploadFile(uuidv4(), file.buffer)
    //     if(file.originalname == "profile"){
    //       profiles.profile = uploaded
    //     }else{
    //       profiles.cover = uploaded
    //     }
    //   }
    //   return profiles
    // }


    // for (let file of files) {
    //   const fileType = this.getFileType(file.mimetype)
    //   let uploaded = await this.uploadService.uploadFile(uuidv4(), file.buffer)
    //   if (fileType == 'video') {
    //     media.videos.push(uploaded)
    //     postMedia.push({ type: 'video', url: uploaded })
    //   }
    //   if (fileType == 'image') {
    //     media.images.push(uploaded)
    //     postMedia.push({ type: 'image', url: uploaded })
    //   }
    // }
    // console.log(media, postMedia)

    // await this.uploadService.storeMedia(details, media)
    // return postMedia
  }

}
