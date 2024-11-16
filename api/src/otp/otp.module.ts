import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SnsModule } from 'src/sns/sns.module';
import { getRedisClient } from 'src/config/redis.config';

@Module({
  providers: [OtpService,     
    {
    provide: "REDIS_CLIENT",
    useFactory: () => getRedisClient(),
  }],

  imports: [SnsModule],
  exports: [OtpService]
})
export class OtpModule {}
