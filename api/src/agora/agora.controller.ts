import { Controller, Get, Query } from '@nestjs/common';
import { AgoraService } from './agora.service';

@Controller('agora')
export class AgoraController {
  constructor(private readonly agoraService: AgoraService) {}

  @Get('token')
  async generateToken(@Query('channelName') channelName: string, @Query('uid') uid: string) {
    return this.agoraService.generateToken(channelName, uid);
  }
}
