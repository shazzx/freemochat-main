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
import { Model, Types } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { CGroupsService } from 'src/cgroups/cgroups.service';
import { CacheService } from 'src/cache/cache.service';
import { FriendService } from 'src/friend/friend.service';
import { MemberService } from 'src/member/member.service';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from 'src/notification/notification.service';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from 'src/schema/Notification';

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
    private readonly memberService: MemberService,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) { }
  @WebSocketServer()
  server: Server;
  connectedUsers: Map<string, string> = new Map()
  groups: Map<string, string> = new Map()

  private logger = new Logger('ChatGateway');

  @SubscribeMessage('chat')
  async handleMessage(@MessageBody() payload: { senderDetails: { targetId: Types.ObjectId, username: string }, body: string, messageType: string, recepientDetails: { username: string, type: string, targetId: string } }) {

    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientDetails.targetId))
    let _user = JSON.parse(await this.cacheService.getOnlineUser(payload.senderDetails.targetId))

    this.logger.log(`Message received: ${payload.senderDetails.targetId + " - " + payload.senderDetails.username + " - " + payload.recepientDetails.targetId + " - " + payload.recepientDetails.username + " - " + payload.body}`);

    try {
      let user = await this.userService.userExists(payload.recepientDetails.targetId)

      if (!user) {
        throw new BadRequestException("User has been deleted")
      }

      let message = await this.messageService.createMessage({ type: payload.recepientDetails.type, sender: new Types.ObjectId(payload.senderDetails.targetId), recepient: new Types.ObjectId(payload.recepientDetails.targetId), content: payload.body, gateway: true, messageType: payload.messageType, })
      const chatlist = await this.chatlistService.createOrUpdateChatList(payload.senderDetails.targetId, payload.recepientDetails.targetId, payload.recepientDetails.type, { sender: payload.senderDetails.targetId, encryptedContent: payload.body, messageId: message._id }, "Text")

      const userPushToken = await this.cacheService.getUserPushToken(payload.recepientDetails.targetId)

      const pushMessage = {
        // to: 'ExponentPushToken[g3lNZoCh-cv0PbpHf-bgNt]',
        to: userPushToken,
        sound: 'default',
        title: payload.recepientDetails.username,
        body: message.content,
        data: { someData: 'goes here' },
      };

      if (!recepient && userPushToken) {
        await this.sendPushNotification(pushMessage)
        this.server.emit('self-response', { ...payload, _id: message._id })
        this.server.emit('chatlist', { users: chatlist })
        this.server.to(_user?.socketId).emit('chat', { ...payload, _id: message._id });

        return
      }


      if (!this.server.sockets.sockets.has(recepient?.socketId) && userPushToken) {
        await this.sendPushNotification(pushMessage)
        this.server.emit('self-response', { ...payload, _id: message._id })
        this.server.emit('chatlist', { users: chatlist })
        this.server.to(_user?.socketId).emit('chat', { ...payload, _id: message._id });
        return
      }

      this.server.emit('self-response', { ...payload, _id: message._id })
      this.server.to(recepient?.socketId).emit('chat', { ...payload, _id: message._id });
      this.server.to(_user?.socketId).emit('chat', { ...payload, _id: message._id });
      this.server.to(_user?.socketId).emit('chatlist', { users: chatlist })
      return payload;
    } catch (error) {
      this.logger.error(error)
    }
  }


  @SubscribeMessage('message-deliverability')
  async handleMessageDeliverability(@MessageBody() payload: { senderId: string, recepientId: string, messageId: string, }) {

    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientId))

    try {
      const chatlist = await this.chatlistService.updateMessageDeliverability(payload.recepientId, payload.senderId, new Types.ObjectId(payload.messageId))

      this.server.to(recepient?.socketId).emit('message-deliverability', { lastSeenMessageId: payload.messageId });
      this.server.emit('chatlist', { users: chatlist })
      return payload;
    } catch (error) {
      this.logger.error(error)
    }
  }

  async sendPushNotification(message) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }).then((data) => {
      console.log('push notification sent')
    }).catch((error) => {
      console.log("something went wrong ", error, error.message)
    })
  }



  @SubscribeMessage('groupchat')
  async handleGroupMessage(@MessageBody() payload: { senderDetails: { targetId: Types.ObjectId, username: string }, body: string, messageType: string, recepientDetails: { name: string, type: string, targetId: string } }) {

    // let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientDetails.targetId))
    // console.log(recepient, recepient)

    this.logger.log(`Group Message received: ${payload.senderDetails.targetId + " - " + payload.senderDetails.username + " - " + payload.recepientDetails.targetId + " - Group Name: " + payload.recepientDetails.name + " - " + payload.body}`);

    try {
      let group = await this.chatGroupService.groupExist(payload.recepientDetails.targetId)
      const members = await this.memberService.getGroupMemberIds(payload.recepientDetails.targetId)

      // console.log(isMember,'ismember')

      if (!group) {
        throw new BadRequestException("Group has been deleted")
      }

      const sender = String(payload.senderDetails.targetId)

      if (!members.includes(sender)) {
        throw new BadRequestException("You're no longer part of the group")
      }

      const message = await this.messageService.createMessage({ type: payload.recepientDetails.type, sender: new Types.ObjectId(payload.senderDetails.targetId), recepient: new Types.ObjectId(payload.recepientDetails.targetId), content: payload.body, gateway: true, messageType: payload.messageType, })
      members.forEach(async (memberId) => {
        await this.chatlistService.createOrUpdateChatList(memberId, payload.recepientDetails.targetId, payload.recepientDetails.type, { sender: payload.senderDetails.targetId, encryptedContent: payload.body, messageId: message._id }, "Text")
      })

      this.server.to(payload.recepientDetails.targetId).emit('groupchat', { ...payload, _id: message._id });
      this.server.emit('chatlist', {})
      return payload;
    } catch (error) {
      const user = await this.cacheService.getOnlineUser(payload.senderDetails.targetId)
      this.server.to(user?.socketId).emit("group-error", { message: "You are no longer part of the group" })
      this.logger.error(error)
    }
  }

  leaveOrRemoveFromGroup(groupId: string) {
    this.server.to(groupId).emit('group-update', { groupId })
  }

  async sendMessage(messageDetails: { type: string, content: string, messageType: string, sender: Types.ObjectId, recepient: Types.ObjectId, media?: { url: string, type?: string, duration?: number, isUploaded: boolean } }) {
    let recepient = JSON.parse(await this.cacheService.getOnlineUser(String(messageDetails.recepient)))
    this.server.to(recepient?.socketId).emit('chat', messageDetails);
  }

  @SubscribeMessage("toggleJoin")
  async handleJoinGroup(client: Socket, payload: { userId: string, groupId: string, memberUsername: string, adminUsername: string, type?: string }) {

    if (payload?.type && payload?.type == 'leave') {
      const result = await this.memberService.toggleJoin(payload.userId, { groupId: payload.groupId, type: "chatgroup" }, payload.memberUsername, payload.adminUsername, payload.type)
      return
    }

    const result = await this.memberService.toggleJoin(payload.userId, { groupId: payload.groupId, type: "chatgroup" }, payload.memberUsername, payload.adminUsername)
    const user = await this.cacheService.getOnlineUser(payload.userId)
    this.server.to(payload.groupId).emit("toggleJoin", { groupId: payload.groupId })
    this.server.to(user?.socketId).emit("toggleJoin", { groupId: payload.groupId })
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
    if (payload.recepientDetails && !payload.recepientDetails.userId) {
      throw new BadRequestException('recepient id required')
    }

    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientDetails.userId))
    let user = JSON.parse(await this.cacheService.getOnlineUser(payload.userDetails.userId))
    let _recepient = await this.userService.getRawUser(payload.recepientDetails.userId)
    let socketStatus = this.server.sockets.sockets.has(recepient?.socketId)

    // console.log(socketStatus, recepient, "socket status and recepient")

    let message = await this.messageService.createMessage({ type: 'User', sender: new Types.ObjectId(payload.userDetails.userId), recepient: new Types.ObjectId(payload.recepientDetails.userId), content: payload?.type, gateway: true, messageType: 'Info', })
    // const chatlist = await this.chatlistService.createOrUpdateChatList(payload.userDetails.userId, payload.recepientDetails.userId, 'User', { sender: payload.senderDetails.userId, encryptedContent: "Video Call", messageId: message._id }, "Text")

    if (recepient?.socketId && socketStatus) {
      this.server.to(user.socketId).emit("call-ringing", { callState: "ringing" })
      this.server.to(recepient.socketId).emit('call-log', { message });
      this.server.to(user.socketId).emit('call-log', { message });

    } else {

      const userPushToken = await this.cacheService.getUserPushToken(_recepient?._id.toString())

      const pushMessage = {
        to: userPushToken,
        sound: 'default',
        title: _recepient.firstname + " " + _recepient.lastname + " is Calling You",
        body: "Open app to become online",
      };

      if (!recepient && userPushToken) {
        await this.sendPushNotification(pushMessage)
        return
      }

      if (!this.server.sockets.sockets.has(recepient?.socketId) && userPushToken) {
        await this.sendPushNotification(pushMessage)
        return
      }
    }

    this.server.to(recepient?.socketId).emit("initiate-call", { userDetails: payload?.userDetails, recepientDetails: { ..._recepient, userId: _recepient._id }, type: payload?.type, isMobile: payload?.isMobile ?? false })
  }

  @SubscribeMessage("call-decline")
  async handleCallDecline(@MessageBody() payload) {
    if (payload.recepientDetails && !payload.recepientDetails.userId) {
      throw new BadRequestException('recepient id required')
    }
    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientDetails.userId))

    this.server.to(recepient?.socketId).emit("call-decline", { status: "DECLINED", payload })
  }

  @SubscribeMessage("call-accept")
  async handleCallAccept(@MessageBody() payload) {
    if (payload.recepientDetails && !payload.recepientDetails.userId) {
      throw new BadRequestException('recepient id required')
    }
    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload.recepientDetails.userId))
    let user = JSON.parse(await this.cacheService.getOnlineUser(payload.userDetails.userId))
    const uuid = uuidv4()

    this.server.to(user?.socketId).emit("call-accept", { status: "ACCEPTED", type: payload.type, channel: uuid, recepientDetails: payload.recepientDetails, isMobile: payload?.isMobile ?? false })
    this.server.to(recepient?.socketId).emit("call-accept", { status: "ACCEPTED", type: payload.type, channel: uuid, recepientDetails: payload.userDetails, isMobile: payload?.isMobile ?? false })
  }

  @SubscribeMessage("call-end")
  async cancelCall(@MessageBody() payload) {
    if (!payload?.recepientDetails && !payload.recepientDetails.userId) {
      throw new BadRequestException('recepient id required')
    }

    let recepient = JSON.parse(await this.cacheService.getOnlineUser(payload?.recepientDetails?.userId))
    let user = JSON.parse(await this.cacheService.getOnlineUser(payload?.userDetails?.userId))

    this.server.to(user?.socketId).emit("call-end", { status: "END", })
    this.server.to(recepient?.socketId).emit("call-end", { status: "END", })
  }

  async handleNotifications(event) {
    let user = JSON.parse(await this.cacheService.getOnlineUser(event.user))

    const userPushToken = await this.cacheService.getUserPushToken(event?.user?.toString())

    console.log(userPushToken, "user push token")

    if (!userPushToken) {
      this.server.to(user?.socketId).emit('notification', event)
      return
    }

    const recepient = await this.userService.getRawUser(event?.user?.toString())
    console.log(recepient._id, "recepient id")

    if (event?.from?.toString() == recepient._id.toString()) {
      console.log("not sending push notification")
      this.server.to(user?.socketId).emit('notification', event)
      return
    }

    const sender = await this.userService.getRawUser(event?.from?.toString())

    if (!sender) {
      console.log("not sending push notification sender not found")
      this.server.to(user?.socketId).emit('notification', event)
      return
    }

    const pushMessage = {
      to: userPushToken,
      sound: 'default',
      title: sender.firstname + " " + sender.lastname,
      body: event.value,
      data: { someData: 'goes here' },
    };

    console.log(pushMessage, "push message")
    this.sendPushNotification(pushMessage)

    this.server.to(user?.socketId).emit('notification', event)
  }


  async sendNotification({ user, reciever, type }: { user: Types.ObjectId | string, reciever: Types.ObjectId | string, type?: string }) {
    let recepient = JSON.parse(await this.cacheService.getOnlineUser(reciever))
    const notification = await this.notificationModel.create(
      {
        from: type == 'request accepted' ? user : reciever,
        user: reciever,
        targetId: user,
        targetType: "user",
        type: "request",
        value: "has accepted your request"
      }
    )

    this.server.to(recepient?.socketId).emit('notification', { acceptedBy: user })
  }


  async handleRequest(request) {
    let user = JSON.parse(await this.cacheService.getOnlineUser(request.user))
    this.server.to(user?.socketId).emit('request', request)
  }


  async uploadSuccess(data) {
    let user = JSON.parse(await this.cacheService.getOnlineUser(data?.target?.targetId))
    this.server.emit('upload-status', data)
    this.server.to(user?.socketId).emit('upload-status', data)
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