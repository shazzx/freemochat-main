import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PopulateOptions } from 'mongoose';
import { CacheService } from 'src/cache/cache.service';
import { MemberService } from 'src/member/member.service';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { ChatItem, MessageType } from 'src/schema/chatlist.schema';
import { MessageSoftDelete } from 'src/schema/chatsoftdelete';

@Injectable()
export class UserChatListService {
    constructor(
        @InjectModel(ChatItem.name) private userChatListModel: Model<ChatItem>,
        @InjectModel(MessageSoftDelete.name) private messageSoftDelete: Model<MessageSoftDelete>,
        private readonly metricsAggregatorService: MetricsAggregatorService,
        private readonly cacheService: CacheService,
    ) { }

    async messagesSeen(chatlistId, userId) {

        const chatlist = await this.userChatListModel.findById(chatlistId)

        if (chatlist.unreadCount == 0) {
            return
        }

        await this.userChatListModel.updateOne(
            { _id: chatlistId },
            {
                unreadCount: 0
            }
        );
        await this.metricsAggregatorService.decrementCount(new Types.ObjectId(userId), 'unreadChatlist', 'user')
        return true
    }

    async createOrUpdateChatList(
        userId: any,
        recepientId: any,
        type: string,
        lastMessage: { sender: Types.ObjectId, encryptedContent: string, messageId: Types.ObjectId },
        messageType: string,
        removeUser?: boolean,
        removeChat?: boolean,
    ): Promise<any> {

        // if (type == 'ChatGroup') {
        //     const userChat = await this.userChatListModel.findOne({
        //         user: userId,
        //         type: type,
        //         recepient: recepientId,
        //     });

        //     if (userChat != null) {
        //         await this.userChatListModel.updateOne(
        //             { _id: userChat._id, 'type': type, 'recepient': recepientId },
        //             {
        //                 $set: {
        //                     removedAt: lastMessage.encryptedContent == 'added in group' ? null : removeUser ? Date.now() : null,
        //                     lastMessage,
        //                     messageType
        //                 },
        //                 $inc: { 'unreadCount': userId.toString() !== lastMessage.sender.toString() ? 1 : 0 },
        //             }
        //         );
        //     } else {
        //         await this.userChatListModel.create({
        //             user: userId,
        //             type,
        //             recepient: recepientId,
        //             lastMessage: { ...lastMessage, createdAt: Date.now() },
        //             removedAt: removeUser ? Date.now() : null,
        //             chatRemovedAt: removeChat ? Date.now() : null,
        //             unreadCount: userId.toString() !== lastMessage.sender.toString() ? 1 : 0
        //         });
        //     }


        // }

        const userChat = await this.userChatListModel.findOne({
            user: userId,
            type: type,
            recepient: recepientId,
        });

        const recepientChat = await this.userChatListModel.findOne({
            user: recepientId,
            type: type,
            recepient: userId,
        });

        if (userChat != null) {
            await this.userChatListModel.updateOne(
                { _id: userChat._id, 'type': type, 'recepient': recepientId },
                {
                    $set: {
                        removedAt: lastMessage.encryptedContent == 'added in group' ? null : removeUser ? Date.now() : null,
                        lastMessage,
                        messageType
                    },
                    $inc: { 'unreadCount': userId.toString() !== lastMessage.sender.toString() ? 1 : 0 },
                }
            );
        } else {
            await this.userChatListModel.create({
                user: userId,
                type,
                recepient: recepientId,
                lastMessage: { ...lastMessage, createdAt: Date.now() },
                removedAt: removeUser ? Date.now() : null,
                chatRemovedAt: removeChat ? Date.now() : null,
                unreadCount: userId.toString() !== lastMessage.sender.toString() ? 1 : 0
            });
        }

        if (recepientChat !== null) {
            await this.userChatListModel.updateOne(
                { _id: recepientChat._id, 'type': type, 'recepient': userId },
                {
                    $set: {
                        lastMessage,
                        messageType
                    },
                    $inc: { 'unreadCount': recepientId.toString() !== lastMessage.sender.toString() ? 1 : 0 },
                }
            );
        } else if (type !== "ChatGroup") {
            await this.userChatListModel.create({
                user: recepientId,
                type,
                recepient: userId,
                messageType,
                lastMessage,
                unreadCount: recepientId.toString() !== lastMessage.sender.toString() ? 1 : 0
            });
        }

        const chatListUser = await this.userChatListModel.find({ user: userId }).populate({
            path: "recepient",
            refPath: "type"
        } as PopulateOptions).sort({ updatedAt: -1 })

        const recepient = await this.userChatListModel.findOne({ user: recepientId, recepient: userId })

        console.log('recepient idididi', recepientId,)

        if (recepient.unreadCount == 1) {
            await this.metricsAggregatorService.incrementCount(new Types.ObjectId(recepientId), 'unreadChatlist', 'user')
        }

        return chatListUser
    }


    async updateMessageDeliverability(
        recepientId: string,
        senderId: string,
        messageId: Types.ObjectId
    ): Promise<any> {
        const updated = await this.userChatListModel.updateOne(
            { recepient: recepientId, user: senderId },
            {
                $set: {
                    lastSeenMessageId: messageId
                },
            }
        );
        return true
    }

    // async removeChat(userId: string, recepientId: string) {
    //     let removedChat = await this.userChatListModel.findOneAndUpdate(
    //         { user: userId, recepient: recepientId },
    //         { chatRemovedAt: Date.now() },
    //         { new: true }
    //     );
    //     console.log(removedChat)
    //     return removedChat
    // }

    async removeChat(userId: string, recepientId: string, lastDeletedId: string) {
        let removedChat = await this.userChatListModel.findOneAndDelete({ user: userId, recepient: recepientId });

        const result = await this.messageSoftDelete.findOneAndUpdate(
            {
                user: new Types.ObjectId(userId),
                recepient: new Types.ObjectId(recepientId)
            },
            {
                $set: {
                    lastDeletedId: new Types.ObjectId(lastDeletedId),
                    user: new Types.ObjectId(userId),
                    recepient: new Types.ObjectId(recepientId)
                }
            },
            {
                upsert: true,
                new: true, // This is equivalent to returnDocument: 'after' in the Node.js driver
                runValidators: true // This ensures that any schema validators are run on insert
            }
        );
        return removedChat
    }


    async removeUser(userId: Types.ObjectId, recepientId: Types.ObjectId) {
        let removedUser = await this.userChatListModel.findOneAndUpdate(
            { user: userId, recepient: recepientId },
            { removedAt: Date.now() },
            { new: true }
        );
        return removedUser
    }

    async getChatList(userId: string, recepient: string) {
        let chat = await this.userChatListModel.findOne({ user: userId, recepient });
        return chat
    }

    async getChatLists(userId) {
        try {
            const general = await this.userChatListModel.find({ user: userId, type: { $in: ['User', 'Page'] } }).populate({
                path: "recepient",
                refPath: "type"
            } as PopulateOptions).sort({ updatedAt: -1 })


            let onlineStatusIntegeration = await Promise.all(general.map(async (chat: any) => {
                let _chat = chat.toObject()
                let onlineStatus = await this.cacheService.isUserOnline(_chat.recepient._id.toString())
                return { ..._chat, onlineStatus }
            }))
            // console.log(onlineStatusIntegeration)


            const groups = await this.userChatListModel.find({ user: userId, type: 'ChatGroup' }).populate({
                path: "recepient",
                refPath: "type"
            } as PopulateOptions).sort({ updatedAt: -1 })

            return { users: onlineStatusIntegeration, groups }



        } catch (error) {
            return null
        }
    }
}