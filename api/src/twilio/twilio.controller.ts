import { Controller, Get, Res } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { Response } from 'express';
import { Public } from 'src/auth/public.decorator';

@Controller('twilio')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Public()
  @Get()
  async sendOtp (@Res() res: Response) {
    return await this.twilioService.sendSMS('+923102763192', 'you otp is this')
  }
}
