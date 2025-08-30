import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { Response } from 'express';
import { Public } from 'src/auth/public.decorator';

@Controller('twilio')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Public()
  @Get()
  async sendOtp (@Res() res: Response) {
  return await this.twilioService.sendSMS('+923102763192', 'your otp is this')
  }


  @Public()
  @Get("ema")
  async sendEmail(@Body() emailData: any) {
    const mail = {
      to: 'shazzexternal@gmail.com',
      from: 'freedombook99@gmail.com',
      subject: "test subject",
      text: 'test',
    };
    return this.twilioService.sendEmail(mail);
  };
}
