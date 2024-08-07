import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { SnsModule } from 'src/sns/sns.module';

@Module({
  controllers: [OtpController],
  providers: [OtpService],
  imports: [SnsModule]
})
export class OtpModule {}
