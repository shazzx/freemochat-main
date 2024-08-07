import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessageService } from 'src/message/message.service';
import { UserChatListService } from 'src/chatlist/chatlist.service';
import { MessageType } from 'src/schema/chatlist.schema';
import { Types } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { CGroupsService } from 'src/cgroups/cgroups.service';
import { randomUUID } from 'crypto';
import { CacheService } from 'src/cache/cache.service';
import { FriendService } from 'src/friend/friend.service';

let connectedUsers = new Map()

@WebSocketGateway({ cors: { origin: '*' } },)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly messageService: MessageService,
    private readonly chatlistService: UserChatListService,
    private readonly chatGroupService: CGroupsService,
    private readonly cacheService: CacheService,
    private readonly friendService: FriendService,
  ) { }
  @WebSocketServer()
  server: Server;
  connectedUsers: Map<string, string> = new Map()
  groups: Map<string, string> = new Map()

  private logger = new Logger('ChatGateway');

  @SubscribeMessage('chat')
  async handleMessage(@MessageBody() payload: { senderDetails: { targetId: Types.ObjectId, username: string }, body: string, messageType: string, recepientDetails: { username: string, type: string, targetId: string } }) {
    
    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientDetails.targetId))
    console.log(recepient)
    console.log(recepient.socketId)
    
    console.log(`Message received: ${payload.senderDetails.targetId + " - " + payload.senderDetails.username + " - " + payload.recepientDetails.targetId + " - " + payload.recepientDetails.username + " - " + payload.body}`);

    try {
      let message = await this.messageService.createMessage({ type: payload.recepientDetails.type, sender: new Types.ObjectId(payload.senderDetails.targetId), recepient: new Types.ObjectId(payload.recepientDetails.targetId), content: payload.body, gateway: true, messageType: payload.messageType, })
      // console.log(message)

    } catch (error) {
      console.log(error)
    }

    const chatlist = await this.chatlistService.createOrUpdateChatList(payload.senderDetails.targetId, payload.recepientDetails.targetId, payload.recepientDetails.type, { sender: payload.senderDetails.targetId, encryptedContent: payload.body }, "Text")

    this.server.to(recepient.socketId).emit('chat', payload);
    this.server.emit('chatlist', { users: chatlist })
    return payload;
  }

  async sendMessage(messageDetails: { type: string, content: string, messageType: string, sender: Types.ObjectId, recepient: Types.ObjectId, media?: { url: string, type: string, duration: string }  }){
    let recepient = JSON.parse(await this.cacheService.getOnlineUser(String(messageDetails.recepient)))
    this.server.to(recepient.socketId).emit('chat', messageDetails);
  }

  @SubscribeMessage("joingroup")
  async handleJoinGroup(client: Socket, payload: { userId: string, groupId: string }) {
    const group: any = await this.chatGroupService.joinChatGroup({ userId: payload.userId }, { groupId: payload.groupId })
    let recepientId = this.connectedUsers.get(client.handshake.auth.username)
    console.log(client.handshake.auth)

    console.log(group)
    client.join(group._id.toString())
    console.log(client.rooms)
    this.server.to(recepientId).emit("joingroup", 'joined')
    return group
  }

  @SubscribeMessage("leavegroup")
  async handleLeaveGroup(client: Socket, payload: { userId: string, groupId: string }) {
    const group: any = await this.chatGroupService.leaveChatGroup({ userId: payload.userId }, { groupId: payload.groupId })
    client.leave(group._id.toString())
    let recepientId = this.connectedUsers.get(client.handshake.auth.username)

    console.log(client.rooms)
    this.server.to(recepientId).emit("leavegroup", 'left')

    return group
  }

  @SubscribeMessage("chatgroup")
  handleGroupMessages(@MessageBody() payload: { userId: string, groupId: string, senderDetails: { userId: Types.ObjectId, username: string }, body: string, recepientDetails: { userId: Types.ObjectId, username: string, type: string, groupId: Types.ObjectId } }): { senderDetails: { userId: Types.ObjectId, username: string }, body: string, recepientDetails: { userId: Types.ObjectId, username: string, type: string, groupId: Types.ObjectId } } {
    console.log(`Message received: ${payload.senderDetails.userId + " - " + payload.senderDetails.username + " - " + payload.recepientDetails.groupId + " - " + payload.recepientDetails.username + " - " + payload.body}`);
    console.log(payload)

    this.groups.set(payload.userId, payload.groupId)
    let recepientId = this.connectedUsers.get(payload.recepientDetails.username)
    console.log(recepientId)

    // this.messageService.createMessage({ type: payload.recepientDetails.type, sender: payload.senderDetails.userId, recepient: payload.recepientDetails.groupId, content: payload.body })

    this.server.to(recepientId).emit('chat', payload); // broadbast a message to all clients

    return payload
  }

  // calling logic
  @SubscribeMessage("initiate-call")
  async handleCallInitiation(@MessageBody() payload) {
    const recepientId = this.connectedUsers.get(payload.recepientDetails.username)
    console.log(payload, 'initiated')

    this.server.to(recepientId).emit("initiate-call", { userDetails: payload?.userDetails, type: payload?.type })
  }

  @SubscribeMessage("call-decline")
  async handleCallDecline(@MessageBody() payload) {
    const recepientId = this.connectedUsers.get(payload.recepientDetails.username)
    console.log(payload, 'declined')

    this.server.to(recepientId).emit("call-decline", { status: "DECLINED", payload })
  }

  @SubscribeMessage("call-accept")
  async handleCallAccept(@MessageBody() payload) {
    const recepientId = this.connectedUsers.get(payload.recepientDetails.username)
    console.log(payload, 'accepted')
    const uuid = '3u293urasdjkof'

    this.server.emit("call-accept", { status: "ACCEPTED", type: payload.type, channel: uuid, recepientDetails: payload.recepientDetails })
  }

  @SubscribeMessage("call-cancel")
  async cancelCall(@MessageBody() payload) {
    console.log(payload)
    const recepientId = this.connectedUsers.get(payload.recepientDetails.username)
    console.log(recepientId)
    console.log(recepientId)

    this.server.to(recepientId).emit("call-cancel", { status: "CANCELED", payload })
  }

  async handleNotifications(event) {
    let recepientId = this.connectedUsers.get(event.username)
    await this.userService.getRawUser(event.userId)
    console.log(event, 'chatgateway')
    console.log(this.connectedUsers)
    console.log(recepientId, 'recepientId')
    this.server.emit('notification', event)
    // this.server.to(recepientId).emit('notification', event)
  }


  async uploadSuccess(data) {
    this.server.emit('upload-status', data)
    console.log('listener called')
    // this.server.to(recepientId).emit('notification', event)
  }

  // it will be handled when a client connects to the server
  async handleConnection(socket: Socket) {
    const username = socket.handshake.auth.username

    this.logger.log(`Socket connected: ${socket.id}, username: ${username}`);

    let user = await this.userService.getUser(username)
    let userId = user[0]._id

    if (userId) {
      await this.cacheService.setUserOnline({ username: user[0].username, userId, images: user[0].images, socketId: socket.id });
      socket.join(userId);
      await this.friendService.updateOnlineFriends(userId);
      await this.notifyFriendsOfOnlineStatus(userId, true);
    }

    const friends = await this.friendService.getFriends(userId);
    let online_friends = await this.cacheService.getOnlineFriends(friends)
    // console.log(online_friends, 'online_friends')
    let chatlist = await this.chatlistService.getChatLists(user[0]._id.toString())

    socket.emit('chatlist', { chatlist })
    socket.emit('online_friends', { online_friends })
  }

  // it will be handled when a client disconnects from the server
  async handleDisconnect(socket: Socket) {
    const username = socket.handshake.auth.username
    let user = await this.userService.getUser(username)
    let userId = user[0]._id

    if (userId) {
      await this.cacheService.setUserOffline(userId);
      await this.notifyFriendsOfOnlineStatus(userId, false);
      // console.log(await this.cacheService.getOnlineUser(userId))
    }

    this.logger.log(`Socket disconnected: ${socket.id}, username: ${username}`);
  }

  @SubscribeMessage('getOnlineFriends')
  async handleGetOnlineFriends(client: Socket): Promise<string[]> {
    const username = client.handshake.auth.username
    let user = await this.userService.getUser(username)
    let userId = user[0]._id
    return await this.friendService.getOnlineFriends(userId);
  }

  private async notifyFriendsOfOnlineStatus(userId: string, isOnline: boolean) {
    const friends = await this.friendService.getFriends(userId);
    console.log(friends, 'friends')
    for (const friendId of friends) {
      let userData = await this.cacheService.getOnlineUser(friendId)
      if (userData) {
        const friendData = JSON.parse(userData);
        this.server.to(friendData.socketId).emit('friendStatus', { 
          friendId: userId, 
          isOnline 
        });
      }
    }
  }
}