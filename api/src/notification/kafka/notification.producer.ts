import { Injectable,  } from '@nestjs/common';
import { Producer, Kafka, logLevel } from 'kafkajs';

@Injectable()
export class NotificationProducer {
    private readonly producer: Producer;

    constructor() {

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

        // this.producer = kafka.producer();
    }

    async sendNotification(event) {
        // let data = JSON.stringify(event)
        // await this.producer.connect();
        // await this.producer.send({
        //     topic: 'notifications',
        //     messages: [{value: data}],
        // });
        // await this.producer.disconnect();
    }

    
    async sendFriendRequest(event) {
        // let data = JSON.stringify(event)
        // await this.producer.connect();
        // await this.producer.send({
        //     topic: 'friendrequests',
        //     messages: [{value: data}],
        // });
        // await this.producer.disconnect();
    }
}