import { Controller, Get, Query} from '@nestjs/common';
import { Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { NotificationService } from './notification.service';
import { Request } from 'types/global';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { Cursor, CursorDTO } from 'src/schema/validation/global';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get()
  async notifications(@Query(new ZodValidationPipe(Cursor)) cursorDTO: CursorDTO, @Req() req: Request, @Res() res: Response) {
    const { sub } = req.user
    const { cursor } = cursorDTO
    res.json(await this.notificationService.getNotifications(cursor, sub))
  }
}
