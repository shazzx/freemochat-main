import { Module } from '@nestjs/common';
import { AgoraService } from './agora.service';
import { AgoraController } from './agora.controller';

@Module({
  exports: [AgoraService],
  providers: [AgoraService],
  controllers: [AgoraController]
})
export class AgoraModule { }
