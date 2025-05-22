import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatGateway } from 'src/chat/chat.gateway';
import { Notification } from 'src/schema/Notification';
import { Types } from 'mongoose'
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  private expo: Expo;

  constructor(
    private configService: ConfigService,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private readonly notificationGateway: ChatGateway,
    private readonly metricsAggregatorService: MetricsAggregatorService,
  ) {
    this.expo = new Expo({
      accessToken: this.configService.get('EXPO_ACCESS_TOKEN'),
    });
  }

  async createNotification(data: { from: Types.ObjectId, user: Types.ObjectId, targetId: Types.ObjectId, type: string, targetType?: string, value: string, handle?: string }, isComment: boolean = false) {
    if (!isComment) {
      console.log("finding notification exist")
      const notifications = await this.notificationModel.findOne(data)
      if (notifications) {
        return null
      }
    }
    const notification = await this.notificationModel.create(data);
    this.metricsAggregatorService.incrementCount(data.user, "notification", "user")
    this.notificationGateway.handleNotifications(data);
    return notification
  }

  public isExpoPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }

  public async sendNotifications(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    try {
      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.log(error)
          throw error;
        }
      }

      return tickets;
    } catch (error) {
      console.log(error)
      throw error;
    }
  }

  public async sendNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<ExpoPushTicket[]> {
    if (!this.isExpoPushToken(token)) {
      throw new Error(`Invalid Expo push token: ${token}`);
    }

    const message: ExpoPushMessage = {
      to: token,
      sound: 'default',
      title,
      body,
      data,
    };

    return this.sendNotifications([message]);
  }

  public async getPushNotificationReceipts(
    tickets: ExpoPushTicket[],
  ): Promise<Record<string, any>> {
    const receiptIds = tickets
      .filter((ticket: any) => ticket.id)
      .map((ticket: any) => ticket.id as string);

    const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
    const receipts: Record<string, any> = {};

    for (const chunk of receiptIdChunks) {
      try {
        const receiptChunk = await this.expo.getPushNotificationReceiptsAsync(chunk);
        Object.assign(receipts, receiptChunk);
      } catch (error) {
        console.log(error)
        throw error;
      }
    }

    return receipts;
  }

  async getNotifications(cursor, userId) {
    const limit = 18
    const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
    const query = { ..._cursor, user: new Types.ObjectId(userId) };

    const notifications = await this.notificationModel.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $limit: limit + 1 },
      {
        $lookup: {
          from: 'users',
          localField: "from",
          foreignField: "_id",
          as: "sender"
        }
      },
      {
        $unwind: "$sender"
      },
      {
        $project: {
          _id: 1,
          user: 1,
          value: 1,
          type: 1,
          targetType: 1,
          handle: 1,
          targetId: 1,
          sender: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      },
    ]);

    const hasNextPage = notifications.length > limit;
    const _notifications = hasNextPage ? notifications.slice(0, -1) : notifications;
    const nextCursor = hasNextPage ? _notifications[_notifications.length - 1].createdAt.toISOString() : null;

    const results = { notifications, nextCursor };
    // this.cacheService.set(cacheKey, JSON.stringify(results), 300)

    return results
  }
}