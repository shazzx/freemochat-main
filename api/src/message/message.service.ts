import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserChatListService } from 'src/chatlist/chatlist.service';
import { MessageSoftDelete } from 'src/schema/chatsoftdelete';
import { Message } from 'src/schema/message';
import { extractFilename } from 'src/utils/global';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(MessageSoftDelete.name) private messageSoftDelete: Model<MessageSoftDelete>,
    private readonly chatlistService: UserChatListService,
    private eventEmitter: EventEmitter2,
  ) { }

  async createMessage(messageDetails: { type: string, content: string, messageType: string, sender: Types.ObjectId, recepient: Types.ObjectId, media?: { url: string, type?: string, duration?: number, isUploaded: boolean }, gateway?: boolean, isGroup?: boolean, removeUser?: boolean, removeChat?: boolean }) {
    const message = await this.messageModel.create(messageDetails)
    if (!messageDetails?.gateway) {
      await this.chatlistService.createOrUpdateChatList(messageDetails.sender.toString(), messageDetails.recepient.toString(), messageDetails.type, { sender: messageDetails.sender, encryptedContent: messageDetails?.isGroup ? messageDetails.content : messageDetails.messageType, messageId: message._id }, messageDetails.messageType, messageDetails.removeUser, messageDetails.removeChat)
    }
    return message
  }

  async updateMessage(messageId: string, messageDetails: { type?: string, content?: string, messageType?: string, media?: { url: string, type?: string, duration?: number, isUploaded: boolean } }) {
    const message = await this.messageModel.findByIdAndUpdate(messageId, { $set: { media: messageDetails.media } }, { new: true })
    return message
  }

  async getMessages(cursor: string, userId: string, recepientId: string, isChatGroup?: number) {
    const limit = 15
    let chatlist = await this.chatlistService.getChatList(userId, recepientId)
    if (!chatlist) {
      return { messages: [], nextCursor: null };
    }

    const softDelete = await this.messageSoftDelete.findOne({ user: new Types.ObjectId(userId), recepient: new Types.ObjectId(recepientId) })
    const _cursor = cursor && softDelete ? { createdAt: { $lt: new Date(cursor) }, _id: { $gt: softDelete.lastDeletedId } } : cursor ? { createdAt: { $lt: new Date(cursor) } } : softDelete ? { _id: { $gt: softDelete.lastDeletedId } } : {}

    let query;
    let messages;
    if (isChatGroup == 0) {
      query = { ..._cursor, $or: [{ sender: new Types.ObjectId(userId), recepient: new Types.ObjectId(recepientId) }, { sender: new Types.ObjectId(recepientId), recepient: new Types.ObjectId(userId) }] }
      messages = await this.messageModel.aggregate([
        { $match: { ...query, } },
        { $sort: { createdAt: -1 } },
        { $limit: limit + 1 },
      ]);

    }
    if (isChatGroup == 1) {
      const _cursor =
        (cursor && softDelete) ? { createdAt: { $lt: new Date(cursor) }, _id: { $gt: softDelete.lastDeletedId } }
          :
          cursor ? { createdAt: { $lt: new Date(cursor) } } : softDelete ? { _id: { $gt: softDelete.lastDeletedId } } : {};

      query = { ..._cursor, recepient: new Types.ObjectId(recepientId) }

      messages = await this.messageModel.aggregate([
        { $match: { ...query } },
        { $sort: { createdAt: -1 } },
        { $limit: limit + 1 },
        {
          $addFields: {
            isCurrentUser: { $eq: ['$senderId', new Types.ObjectId(userId)] }
          }
        },
        {
          $facet: {
            currentUserMessages: [
              { $match: { isCurrentUser: true } },
              {
                $addFields: {
                  sender: {
                    _id: '$senderId',
                  }
                }
              }
            ],
            otherMessages: [
              { $match: { isCurrentUser: false } },
              {
                $lookup: {
                  from: 'users',
                  let: { senderId: '$sender' },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ['$_id', '$$senderId'] }
                      }
                    },
                    {
                      $project: {
                        _id: 1,
                        username: 1,
                        firstname: 1,
                        lastname: 1,
                        profile: 1,
                        email: 1
                      }
                    }
                  ],
                  as: 'senderData'
                }
              },
              {
                $addFields: {
                  sender: { $arrayElemAt: ['$senderData', 0] }
                }
              }
            ]
          }
        },
        {
          $project: {
            allMessages: {
              $concatArrays: ['$currentUserMessages', '$otherMessages']
            }
          }
        },
        { $unwind: '$allMessages' },
        { $replaceRoot: { newRoot: '$allMessages' } },
      ])

    }

    if (!messages) {
      throw new BadRequestException("Please provide proper details")
    }


    const hasNextPage = messages.length > limit;
    const _messages = hasNextPage ? messages.slice(0, -1).reverse() : messages.reverse();
    const nextCursor = hasNextPage ? _messages[0].createdAt.toISOString() : null;

    const results = { messages: _messages, nextCursor };
    return results
  }

  async removeMessage(recepientId: string, userId: string, messageId: string, senderId: string) {
    const message = await this.messageModel.findById(messageId)

    if (message?.media && !message?.media?.isUploaded) {
      throw new BadRequestException("This message is not uploaded, so it cannot be deleted");
    }

    if (!message) {
      throw new BadRequestException("Message not found");
    }

    if (message?.media) {
      const filename = extractFilename(String(message.media.url))
      this.eventEmitter.emit('files.delete', {
        filenames: [filename]
      });
    }

    const updated = await this.messageModel.findByIdAndUpdate(messageId,
      { $push: { deletedFor: { userId, deletedAt: Date.now() } }, media: null }
    )


    if (updated) {
      await this.chatlistService.updateChatlistLastMessage(recepientId, userId, { encryptedContent: 'message deleted', messageId: new Types.ObjectId(messageId), sender: senderId })
    }

    return updated
  }
}
