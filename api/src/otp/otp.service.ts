import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { SnsService } from 'src/sns/sns.service';
import * as otplib from 'otplib'
import * as crypto from 'crypto'

@Injectable()
export class OtpService {
  private readonly sesClient: SESClient
  private readonly otpSecret = process.env.OTP_SECRET || 'shazzx';

  constructor(private readonly snsService: SnsService) {
    this.sesClient = new SESClient({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

  }

  async generateOtp(secret: string): Promise<string> {
    return otplib.authenticator.generate(secret);
  }

  async verifyOtp(token: string, secret: string): Promise<boolean> {
    return otplib.authenticator.verify({ token, secret });
  }

  async sendOTPEmail(to: string, otp: string) {
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
      console.log('sending otp email...')
      await this.sesClient.send(new SendEmailCommand(params));
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendOTPPhone(otp: string, phoneNumber: string): Promise<string> {
    const message = `Your OTP is: ${otp}`;
    try {
      console.log("sending otp sms..")
      await this.snsService.sendSMS(phoneNumber, message);
    } catch (error) {
      console.error(error)      
    }


    return otp;
  }
}