import { Injectable } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

@Injectable()
export class SnsService {
  private snsClient: SNSClient;

  constructor() {
    this.snsClient = new SNSClient({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    const params = {
      Message: message,
      PhoneNumber: '923122734021',
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          'DataType': 'String',
          'StringValue': '912312312'
        },
        'AWS.SNS.SMS.SMSType': {
          'DataType': 'String',
          'StringValue': "Transactional"
        }
      }

    };

    try {
      const command = new PublishCommand(params);
      const sent = await this.snsClient.send(command);
      console.log(sent)
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }
}