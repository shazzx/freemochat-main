import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';
import { getRedisClient } from 'src/config/redis.config';

@Module({
  controllers: [CacheController],
  providers: [
    {
      provide: "REDIS_CLIENT",
      useFactory: () => getRedisClient(),
    },
    CacheService],
  exports: [CacheService]
})
export class CacheModule { }
