import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import SendGrid from '@sendgrid/mail';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

@Injectable()
export class TwilioService {
  private client: twilio.Twilio;

  constructor(private configService: ConfigService) {
    SendGrid.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not properly configured.');
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendSMS(to: string, body: string): Promise<MessageInstance> {
    try {
    const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    console.log('sending sms to ',to)
    
    if (!from) {
      throw new Error('Twilio phone number is not configured.');
    }

      const message = await this.client.messages.create({
        body,
        from,
        to,
      });
      
      return message;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw new Error(error.name);
    }
  }
  async sendEmail(mail: SendGrid.MailDataRequired) {
    console.log(mail)
    const transport = await SendGrid.send(mail);
    console.log(`Email successfully dispatched to ${mail.to}`);
    return transport;
  }
}