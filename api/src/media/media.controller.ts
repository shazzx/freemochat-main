import { Controller, Get, Req, Res } from '@nestjs/common';
import { MediaService } from './media.service';
import { Request, Response } from 'express';
import { ObjectId } from 'mongoose';
import { Public } from 'src/auth/public.decorator';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) { }

  @Public()
  @Get("")
  async media(@Req() req: Request, @Res() response: Response) {
    const { targetId } = req.query as {targetId: string}
    console.log(targetId, 'targetid media')
    response.json(await this.mediaService.getMedia(targetId))
  }
}
