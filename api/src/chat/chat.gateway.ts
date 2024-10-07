import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { BadRequestException, forwardRef, Inject, Logger } from '@nestjs/common';
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
import { MemberService } from 'src/member/member.service';

let connectedUsers = new Map()

@WebSocketGateway({ cors: { origin: '*' }, path: "/api/socket" },)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly messageService: MessageService,
    private readonly chatlistService: UserChatListService,
    private readonly chatGroupService: CGroupsService,
    private readonly cacheService: CacheService,
    private readonly friendService: FriendService,
    private readonly memberService: MemberService
  ) { }
  @WebSocketServer()
  server: Server;
  connectedUsers: Map<string, string> = new Map()
  groups: Map<string, string> = new Map()

  private logger = new Logger('ChatGateway');

  @SubscribeMessage('chat')
  async handleMessage(@MessageBody() payload: { senderDetails: { targetId: Types.ObjectId, username: string }, body: string, messageType: string, recepientDetails: { username: string, type: string, targetId: string } }) {

    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientDetails.targetId))
    console.log(recepient, recepient)

    this.logger.log(`Message received: ${payload.senderDetails.targetId + " - " + payload.senderDetails.username + " - " + payload.recepientDetails.targetId + " - " + payload.recepientDetails.username + " - " + payload.body}`);

    try {
      let user = await this.userService.userExists(payload.recepientDetails.targetId)

      if (!user) {
        throw new BadRequestException("User has been deleted")
      }

      let message = await this.messageService.createMessage({ type: payload.recepientDetails.type, sender: new Types.ObjectId(payload.senderDetails.targetId), recepient: new Types.ObjectId(payload.recepientDetails.targetId), content: payload.body, gateway: true, messageType: payload.messageType, })
      const chatlist = await this.chatlistService.createOrUpdateChatList(payload.senderDetails.targetId, payload.recepientDetails.targetId, payload.recepientDetails.type, { sender: payload.senderDetails.targetId, encryptedContent: payload.body, messageId: message._id }, "Text")

      this.server.to(recepient?.socketId).emit('chat', { ...payload, _id: message._id });
      this.server.emit('chatlist', { users: chatlist })
      return payload;
    } catch (error) {
      this.logger.error(error)
    }
  }


  @SubscribeMessage('groupchat')
  async handleGroupMessage(@MessageBody() payload: { senderDetails: { targetId: Types.ObjectId, username: string }, body: string, messageType: string, recepientDetails: { name: string, type: string, targetId: string } }) {

    // let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientDetails.targetId))
    // console.log(recepient, recepient)

    this.logger.log(`Group Message received: ${payload.senderDetails.targetId + " - " + payload.senderDetails.username + " - " + payload.recepientDetails.targetId + " - Group Name: " + payload.recepientDetails.name + " - " + payload.body}`);

    try {
      let group = await this.chatGroupService.groupExist(payload.recepientDetails.targetId)
      if (!group) {
        throw new BadRequestException("Group has been deleted")
      }

      const message = await this.messageService.createMessage({ type: payload.recepientDetails.type, sender: new Types.ObjectId(payload.senderDetails.targetId), recepient: new Types.ObjectId(payload.recepientDetails.targetId), content: payload.body, gateway: true, messageType: payload.messageType, })
      const chatlist = await this.chatlistService.createOrUpdateChatList(payload.senderDetails.targetId, payload.recepientDetails.targetId, payload.recepientDetails.type, { sender: payload.senderDetails.targetId, encryptedContent: payload.body, messageId: message._id }, "Text")

      console.log('sending to : ', payload.recepientDetails.targetId)
      this.server.to(payload.recepientDetails.targetId).emit('groupchat', { ...payload, _id: message._id });
      this.server.emit('chatlist', { groups: chatlist })
      return payload;
    } catch (error) {
      
      this.logger.error(error)
    }
  }

  leaveOrRemoveFromGroup(groupId: string){
    this.server.to(groupId).emit('group-update', {groupId})
  }

  async sendMessage(messageDetails: { type: string, content: string, messageType: string, sender: Types.ObjectId, recepient: Types.ObjectId, media?: { url: string, type?: string, duration?: number, isUploaded: boolean } }) {
    let recepient = JSON.parse(await this.cacheService.getOnlineUser(String(messageDetails.recepient)))
    this.server.to(recepient?.socketId).emit('chat', messageDetails);
  }

  @SubscribeMessage("toggleJoin")
  async handleJoinGroup(client: Socket, payload: { userId: string, groupId: string }) {
    const result = await this.memberService.toggleJoin(payload.userId, {groupId: payload.groupId, type: "chatgroup"}, )
    console.log(result, 'togglejoin')
    const user = await this.cacheService.getOnlineUser(payload.userId)
    console.log(user, 'toggle joing member')
    this.server.to(payload.groupId).emit("toggleJoin", {groupId: payload.groupId})
    this.server.to(user?.socketId).emit("toggleJoin", {groupId: payload.groupId})
  }

  // @SubscribeMessage("leavegroup")
  // async handleLeaveGroup(client: Socket, payload: { userId: string, groupId: string }) {
  // }

  // @SubscribeMessage("chatgroup")
  // handleGroupMessages(@MessageBody() payload: { userId: string, groupId: string, senderDetails: { userId: Types.ObjectId, username: string }, body: string, recepientDetails: { userId: Types.ObjectId, username: string, type: string, groupId: Types.ObjectId } }): { senderDetails: { userId: Types.ObjectId, username: string }, body: string, recepientDetails: { userId: Types.ObjectId, username: string, type: string, groupId: Types.ObjectId } } {
  //   console.log(`Message received: ${payload.senderDetails.userId + " - " + payload.senderDetails.username + " - " + payload.recepientDetails.groupId + " - " + payload.recepientDetails.username + " - " + payload.body}`);
  //   console.log(payload)

  //   this.groups.set(payload.userId, payload.groupId)
  //   let recepientId = this.connectedUsers.get(payload.recepientDetails.username)
  //   console.log(recepientId)

  //   // this.messageService.createMessage({ type: payload.recepientDetails.type, sender: payload.senderDetails.userId, recepient: payload.recepientDetails.groupId, content: payload.body })

  //   this.server.to(recepientId).emit('chat', payload); // broadbast a message to all clients

  //   return payload
  // }

  // calling logic
  @SubscribeMessage("initiate-call")
  async handleCallInitiation(@MessageBody() payload) {
    console.log(payload)
    if (payload.recepientDetails && !payload.recepientDetails.userId) {
      throw new BadRequestException('recepient id required')
    }
    console.log(payload)
    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientDetails.userId))
    let user = await this.userService.getRawUser(payload.userDetails.userId)
    let _recepient = await this.userService.getRawUser(payload.recepientDetails.userId)
    this.server.to(recepient?.socketId).emit("initiate-call", { userDetails: payload?.userDetails, recepientDetails: { ..._recepient, userId: _recepient._id }, type: payload?.type })
  }

  @SubscribeMessage("call-decline")
  async handleCallDecline(@MessageBody() payload) {
    console.log(payload, 'decline payload')
    if (payload.recepientDetails && !payload.recepientDetails.userId) {
      throw new BadRequestException('recepient id required')
    }
    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientDetails.userId))

    console.log(payload, 'declined')

    this.server.to(recepient?.socketId).emit("call-decline", { status: "DECLINED", payload })
  }

  @SubscribeMessage("call-accept")
  async handleCallAccept(@MessageBody() payload) {
    if (payload.recepientDetails && !payload.recepientDetails.userId) {
      throw new BadRequestException('recepient id required')
    }
    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientDetails.userId))
    let user = JSON.parse(await this.cacheService.getOnlineUser(payload.userDetails.userId))
    console.log(user, 'accepted')
    const uuid = '3u293urasdjkof'


    this.server.to(user?.socketId).emit("call-accept", { status: "ACCEPTED", type: payload.type, channel: uuid, recepientDetails: payload.recepientDetails })
    this.server.to(recepient?.socketId).emit("call-accept", { status: "ACCEPTED", type: payload.type, channel: uuid, recepientDetails: payload.userDetails })
  }

  @SubscribeMessage("call-end")
  async cancelCall(@MessageBody() payload) {
    console.log(payload, 'call end payload')
    if (!payload?.recepientDetails && !payload.recepientDetails.userId) {
      throw new BadRequestException('recepient id required')
    }

    console.log(payload, 'call end payload')
    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload?.recepientDetails?.userId))
    let user = JSON.parse(await this.cacheService.getOnlineUser(payload?.userDetails?.userId))

    console.log(user, 'user')
    console.log(recepient, 'recepient')

    this.server.to(user?.socketId).emit("call-end", { status: "END", })
    this.server.to(recepient?.socketId).emit("call-end", { status: "END", })
  }

  async handleNotifications(event) {
    let user = JSON.parse(await this.cacheService.getOnlineUser(event.user))
    this.server.to(user?.socketId).emit('notification', event)
  }


  async handleRequest(request) {
    let user = JSON.parse(await this.cacheService.getOnlineUser(request.user))
    this.server.to(user?.socketId).emit('request', request)
  }


  async uploadSuccess(data) {
    let user = JSON.parse(await this.cacheService.getOnlineUser(data?.target?.targetId))
    console.log(user, 'online user')
    this.server.to(user?.socketId).emit('upload-status', data)
    console.log('listener called')
    // this.server.to(recepientId).emit('notification', event)
  }

  async handleConnection(socket: Socket) {
    const username = socket.handshake.auth.username
    this.logger.log(`Socket connected: ${socket.id}, username: ${username}`);

    try {
      const user = await this.userService.getUser(username)
      const userId = user[0]._id

      await this.cacheService.setUserOffline(userId)
      await this.cacheService.setUserOnline({ username: user[0].username, userId, images: user[0].images, socketId: socket.id });
      await this.notifyFriendsOfOnlineStatus(userId, true);

      const friends = await this.friendService.getFriends(userId);
      const online_friends = await this.cacheService.getOnlineFriends(friends)
      const chatlist = await this.chatlistService.getChatLists(user[0]._id.toString())
      const groups = await this.memberService.getGroupIds(userId)
      groups.forEach((group) => {
        console.log('joining', group)
        socket.join(group)
      })

      socket.emit('chatlist', { chatlist })
      socket.emit('online_friends', { online_friends })

    } catch (error) {
      this.logger.error(`Socket Id: ${socket.id}, username: ${username}, error: ${error}`);
    }
  }

  // it will be handled when a client disconnects from the server
  async handleDisconnect(socket: Socket) {
    const username = socket.handshake.auth.username
    this.logger.log(`Socket disconnected: ${socket.id}, username: ${username}`);

    try {
      const user = await this.userService.getUser(username)
      const userId = user[0]._id
      await this.cacheService.setUserOffline(userId);
      await this.notifyFriendsOfOnlineStatus(userId, false);


    } catch (error) {
      this.logger.error(`Socket Id: ${socket.id}, username: ${username}, error: ${error}`);
    }
  }

  @SubscribeMessage('getOnlineFriends')
  async handleGetOnlineFriends(client: Socket): Promise<string[]> {
    const username = client.handshake.auth.username
    const user = await this.userService.getUser(username)
    const userId = user[0]._id
    return await this.friendService.getOnlineFriends(userId);
  }

  private async notifyFriendsOfOnlineStatus(userId: string, isOnline: boolean) {
    const friends = await this.friendService.getFriends(userId);
    try {
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
    } catch (error) {
      this.logger.error(`userId: ${userId}, error: ${error}`);
    }
  }
}