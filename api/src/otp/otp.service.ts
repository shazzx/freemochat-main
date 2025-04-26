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






















  

  // deprecated

  // generateSecret(): GeneratedSecret {
  //   return speakeasy.generateSecret({length: 20});
  // }

  // generateOtp(secret: GeneratedSecret): string {
  //   return speakeasy.totp({
  //     secret: secret.base32,
  //     encoding: 'base32',
  //     algorithm: "sha256",
  //   });
  // }

  // verifyOtp(token: string, secret: string): boolean {
  //   return speakeasy.totp.verify({token, secret, algorithm: 'sha256', encoding: 'base32', window: 10});
  // }

  // async sendOTPEmail(to: string, otp: string) {
  //   const params = {
  //     Source: 'thanosgaming121@gmail.com',
  //     Destination: {
  //       ToAddresses: [to],
  //     },
  //     Message: {
  //       Subject: {
  //         Data: 'Your OTP',
  //       },
  //       Body: {
  //         Text: {
  //           Data: `Your OTP is: ${otp}`,
  //         },
  //       },
  //     },
  //   };

  //   try {
  //     console.log('sending otp email...')
  //     await this.sesClient.send(new SendEmailCommand(params));
  //   } catch (error) {
  //     console.error('Error sending email:', error);
  //     throw error;
  //   }
  // }

  // async sendOTPPhone(phoneNumber: string, otp: string): Promise<string> {
  //   const message = `Your OTP is: ${otp}`;
  //   try {
  //     console.log("sending otp sms..")
  //     await this.snsService.sendSMS(phoneNumber, message);
  //   } catch (error) {
  //     console.error(error)      
  //   }


  //   return otp;
  // }
}