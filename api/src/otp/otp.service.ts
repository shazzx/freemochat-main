import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { SnsService } from 'src/sns/sns.service';

@Injectable()
export class OtpService {
  private readonly sesClient
  constructor(private readonly snsService: SnsService) {
    this.sesClient = new SESClient({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }


  async sendOtpEmail(to: string, otp: string) {
    const params = {
      Source: 'thanosgaming121@gmail.com',
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: 'Your OTP',
        },
        Body: {
          Text: {
            Data: `Your OTP is: ${otp}`,
          },
        },
      },
    };

    try {
      await this.sesClient.send(new SendEmailCommand(params));
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendOTP(phoneNumber: string): Promise<string> {
    const otp = this.generateOTP();
    const message = `Your OTP is: ${otp}`;

    await this.snsService.sendSMS(phoneNumber, message);

    return otp;
  }
}