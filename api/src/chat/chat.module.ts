import { forwardRef, Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { MessageModule } from "src/message/message.module";
import { ChatlistModule } from "src/chatlist/chatlist.module";
import { UserModule } from "src/user/user.module";
import { CGroupsModule } from "src/cgroups/cgroups.module";
import { CacheModule } from "src/cache/cache.module";
import { FriendModule } from "src/friend/friend.module";
import { MemberModule } from "src/member/member.module";
import { MongooseModule } from "@nestjs/mongoose";
import { Notification, notificationSchema } from "src/schema/Notification";

@Module({
  imports: [forwardRef(() => UserModule), MessageModule, MemberModule, CacheModule, FriendModule, ChatlistModule, CGroupsModule, MongooseModule.forFeature([{name: Notification.name, schema: notificationSchema}])],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule { }
