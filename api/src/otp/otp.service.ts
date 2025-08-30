import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { randomInt } from 'crypto';
@Injectable()
export class OtpService {

  constructor(@Inject("REDIS_CLIENT") private readonly redis: Redis) {}

  async generateOtp(userId: string, type: string): Promise<string> {
    const otp = randomInt(100000, 999999).toString();
    await this.redis.set(`otp:${type}:${userId}`, otp, 'EX', 1800); 
    return otp;
  }

  async verifyOtp(userId: string, otp: string, type: string): Promise<boolean> {
    const storedOtp = await this.redis.get(`otp:${type}:${userId}`);
    if (storedOtp === otp) {
      await this.redis.del(`otp:${type}:${userId}`);
      return true;
    }
    return false;
  }
}