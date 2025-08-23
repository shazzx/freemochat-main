import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import SendGrid from '@sendgrid/mail';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class TwilioService {
  private client: twilio.Twilio;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService
  ) {
    SendGrid.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not properly configured.');
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendSMS(to: string, body: string): Promise<any> {
    try {
      const isLimitExceeded = await this.cacheService.checkOtpLimit(to);
      if (isLimitExceeded) {
        throw new Error('OTP limit exceeded. Maximum 3 OTPs allowed per day.');
      }

      const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');

      if (!from) {
        throw new Error('Twilio phone number is not configured.');
      }

      const message = await this.client.messages.create({
        body,
        from,
        to,
        riskCheck: 'disable'
      });

      await this.cacheService.incrementOtpCount(to);
      return message;
    } catch (error) {
      throw new Error(error.name);
    }
  }
  async sendEmail(mail: SendGrid.MailDataRequired) {
    const transport = await SendGrid.send(mail);
    return transport;
  }
}