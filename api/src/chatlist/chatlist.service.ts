import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PopulateOptions } from 'mongoose';
import { CacheService } from 'src/cache/cache.service';
import { ChatItem, MessageType } from 'src/schema/chatlist.schema';

@Injectable()
export class UserChatListService {
    constructor(
        @InjectModel(ChatItem.name) private userChatListModel: Model<ChatItem>,
        private readonly cacheService: CacheService
    ) { }

    async createOrUpdateChatList(
        userId: any,
        recepientId: any,
        type: string,
        lastMessage: { sender: Types.ObjectId, encryptedContent: string },
        messageType: string,
        removeUser?: boolean,
        removeChat?: boolean,
    ): Promise<any> {
        console.log(userId, recepientId, type, lastMessage, 'inside chatlist')

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
        } else {
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


        return chatListUser
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

    async removeChat(userId: string, recepientId: string) {
        let removedChat = await this.userChatListModel.findOneAndDelete({ user: userId, recepient: recepientId });
        console.log(removedChat)
        return removedChat
    }


    async removeUser(userId, recepientId) {
        let removedUser = await this.userChatListModel.findOneAndUpdate(
            { user: userId, recepient: recepientId },
            { removedAt: Date.now() },
            { new: true }
        );
        console.log(removedUser)
        return removedUser
    }

    async removeChatRecord(userId, recepientId) {

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