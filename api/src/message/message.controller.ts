import { Body, Controller, Get, Post, Put, Query, Req, Res, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { MessageService } from './message.service';
import { Response } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose'
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'
import { UploadService } from 'src/upload/upload.service';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { CreateMessage, CreateMessageDTO, GetMessages, GetMessagesDTO, RemoveMessage, RemoveMessageDTO } from 'src/schema/validation/message';
import { Request } from 'types/global';

@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService, private readonly uploadService: UploadService,
    private readonly notificationGateway: ChatGateway
  ) { }

  @UseInterceptors(FileInterceptor('file'))
  @Post("create")
  async createMessage(
    @Body(new ZodValidationPipe(CreateMessage, true, "messageData")) createMessageDTO: CreateMessageDTO, messageData: string,
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File) {
    let { type, content, sender, recepient, mediaDetails, messageType } = createMessageDTO
    console.log(createMessageDTO, 'call')

    const fileType = getFileType(file.mimetype)
    const filename = uuidv4()

    console.log(fileType, filename, type, content, sender, recepient)
    let uploaded: { url: string, fileName: string, fileType: string } = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
    console.log(uploaded)

    let message = await this.messageService.createMessage({ type, content, sender: new Types.ObjectId(sender), recepient: new Types.ObjectId(recepient), media: { url: uploaded.url, ...mediaDetails }, messageType })

    this.notificationGateway.sendMessage({ type, content, sender: new Types.ObjectId(sender), recepient: new Types.ObjectId(recepient), media: { url: uploaded.url, ...mediaDetails }, messageType })

    res.json(message)
  }

  @Get()
  async getMessages(
    @Query(new ZodValidationPipe(GetMessages)) getMessagesDTO: GetMessagesDTO,
    @Req() req: Request,
    @Res() res: Response) {

    const { sub } = req.user
    const { cursor, recepientId, isChatGroup } = getMessagesDTO

    res.json(await this.messageService.getMessages(cursor, sub, recepientId, Number(isChatGroup)))
  }

  @Post("remove")
  async removeMessage(
    @Body(new ZodValidationPipe(RemoveMessage)) removeMessageDTO: RemoveMessageDTO,
    @Req() req: Request,
    @Res() res: Response) {

    const { sub } = req.user
    const { messageId } = removeMessageDTO
    res.json(await this.messageService.removeMessage(sub, messageId))
  }
}
