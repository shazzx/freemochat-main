import { Body, Controller, Get, Post, Put, Req, Res, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { MessageService } from './message.service';
import { Request, response, Response } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose'
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'
import { UploadService } from 'src/upload/upload.service';
import { ChatGateway } from 'src/chat/chat.gateway';

@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService, private readonly uploadService: UploadService,
    private readonly notificationGateway: ChatGateway
  ) { }

  @UseInterceptors(FileInterceptor('file'))
  @Post("create")
  async createMessage(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File,
    @Body("messageData") messageData: string) {
    let { type, content, sender, recepient, mediaDetails, messageType } = JSON.parse(messageData) as { type: string, content: string, sender: Types.ObjectId, recepient: Types.ObjectId, mediaDetails: {type: string, duration: string}, messageType: string }

    const fileType = getFileType(file.mimetype)
    const filename = uuidv4()

    console.log(fileType, filename, type, content, sender, recepient)
    let uploaded: {url: string, fileName: string, fileType: string} = await this.uploadService.processAndUploadContent(file.buffer, filename, "audio")
    console.log(uploaded)

    let message = await this.messageService.createMessage({ type, content, sender: new Types.ObjectId(sender), recepient: new Types.ObjectId(recepient), media: { url: uploaded.url, ...mediaDetails }, messageType})

    this.notificationGateway.sendMessage({ type, content, sender: new Types.ObjectId(sender), recepient: new Types.ObjectId(recepient), media: { url: uploaded.url, ...mediaDetails }, messageType})

    res.json(message)
  }

  @Get()
  async getMessages(@Req() req: Request, @Res() response: Response) {
    const { sub } = req.user as { username: string, sub: string }
    const { cursor, recepientId, isChatGroup } = req.query as { cursor: string, recepientId: string, isChatGroup: unknown }
    // isChatGroup is number 1 or 0
    let _isChatGroup = Number(isChatGroup)
    console.log(_isChatGroup, isChatGroup)
    response.json(await this.messageService.getMessages(cursor, sub, recepientId, _isChatGroup))
  }

  @Post("remove")
  async removeMessage(@Req() req: Request, @Res() response: Response) {
    const { sub } = req.user as { username: string, sub: string }
    const { messageId } = req.body
    response.json(await this.messageService.removeMessage(sub, messageId))
  }


}
