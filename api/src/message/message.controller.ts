import { BadRequestException, Body, Controller, Get, Post, Put, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FileValidatorPipe } from 'src/file-validation.pipe';

@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService, private readonly uploadService: UploadService,
    private readonly eventEmiiter: EventEmitter2,
  ) { }

  @UseInterceptors(FileInterceptor('file'))
  @Post("create")
  async createMessage(
    @Body(new ZodValidationPipe(CreateMessage, true, "messageData")) createMessageDTO: CreateMessageDTO, messageData: string,
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile(FileValidatorPipe) file: Express.Multer.File) {
    let { type, content, sender, recepient, mediaDetails, messageType, localUrl } = createMessageDTO

    console.log(mediaDetails, 'controller media details')

    const fileType = getFileType(file.mimetype)
    const filename = uuidv4()

    if(fileType == 'unsupported'){
      throw new BadRequestException("Unsupported file")
    }

    const {sub} = req.user

    const uploadPromise = this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
    
    let message = await this.messageService.createMessage({ type, content, sender: new Types.ObjectId(sender), recepient: new Types.ObjectId(recepient), media: { url: localUrl, ...mediaDetails, isUploaded: false }, messageType })

    this.eventEmiiter.emit("messageMedia.upload", { uploadPromise: [uploadPromise], messageId: message._id.toString(), userId: sub, messageDetails: { type, content, sender: new Types.ObjectId(sender), recepient: new Types.ObjectId(recepient), media: { ...mediaDetails }, messageType }})
 
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
