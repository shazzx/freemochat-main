import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SnsModule } from 'src/sns/sns.module';

@Module({
  providers: [OtpService],
  imports: [SnsModule],
  exports: [OtpService]
})
export class OtpModule {}
