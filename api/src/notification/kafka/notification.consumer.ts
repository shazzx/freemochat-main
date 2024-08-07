import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, KafkaMessage, logLevel } from 'kafkajs';
import { NotificationService } from '../notification.service';
import { KafkaTopicName } from 'aws-sdk/clients/pipes';

@Injectable()
export class NotificationConsumer implements OnModuleInit {
  private readonly consumer: Consumer;

  constructor(private readonly notificationService: NotificationService) {

    // const kafka = new Kafka({
    //     brokers: ['clever-tortoise-14954-eu2-kafka.upstash.io:9092'],
    //     ssl: true,
    //     sasl: {
    //         mechanism: 'scram-sha-256',
    //         username: 'Y2xldmVyLXRvcnRvaXNlLTE0OTU0JFeYOMpCPD8zQViCm8Z-2SIS9uK374ueEOo',
    //         password: 'MjRiMzQxZDUtYjM0Ni00MjQ4LTk4NmQtYzJlZWU0OTM5ZDZi'
    //     },
    //     logLevel: logLevel.ERROR,
    // });

    // this.consumer = kafka.consumer({groupId: "shazzxhere"});;
  }

  async onModuleInit() {
    // await this.consumer.connect();
    // await this.consumer.subscribe({ topic: 'notifications' });
    // await this.consumer.subscribe({ topic: 'friendrequests' });

    // await this.consumer.run({
    //   eachMessage: async ({ topic, partition, message }: { topic: KafkaTopicName, partition: any, message: KafkaMessage }) => {

    //     if (topic == 'notifications') {
    //       const event = JSON.parse(message.value.toString());
    //       await this.notificationService.createNotification(event);
    //     }
    //     if (topic == 'friendrequests') {
    //       const event = JSON.parse(message.value.toString());
    //       await this.notificationService.createNotification(event);
    //     }
    //   },
    // });
  }
}