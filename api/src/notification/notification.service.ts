import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatGateway } from 'src/chat/chat.gateway';
import { Notification } from 'src/schema/Notification';
import { Types } from 'mongoose'

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private readonly notificationGateway: ChatGateway
  ) { }

  async createNotification(data: { from: Types.ObjectId, user: Types.ObjectId, targetId: Types.ObjectId, type: string, targetType?: string,  value: string }) {
    console.log(data)
    const notifications = await this.notificationModel.findOne({ user: data.user, type: data.type, from: data.from, targetId: data.targetId, targetType: data.targetType })
    if (notifications) {
      console.log('notfcaton exsts')
      return null
    }
    const notification = await this.notificationModel.create(data);
    this.notificationGateway.handleNotifications(data);
    return notification
  }

  // async getNotifications(userId) {
  //   const notifications = await this.notificationModel.find({ user: userId }).populate({
  //     path: "from",
  //     model: "User",
  //   },
  //   )
  //   return notifications
  // }

  async getNotifications(cursor, userId) {
    const limit = 5
    const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
    const query = { ..._cursor, user: new Types.ObjectId(userId) };

    console.log(query, 'notifications query')
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
          targetId: 1,
          sender: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      },
    ]);

    console.log(notifications)

    const hasNextPage = notifications.length > limit;
    const _notifications = hasNextPage ? notifications.slice(0, -1) : notifications;
    const nextCursor = hasNextPage ? _notifications[_notifications.length - 1].createdAt.toISOString() : null;

    const results = { notifications, nextCursor };
    // this.cacheService.set(cacheKey, JSON.stringify(results), 300)

    return results
  }
}