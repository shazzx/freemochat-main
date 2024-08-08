import { forwardRef, Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { MessageModule } from "src/message/message.module";
import { ChatlistModule } from "src/chatlist/chatlist.module";
import { UserModule } from "src/user/user.module";
import { CGroupsModule } from "src/cgroups/cgroups.module";
import { CacheModule } from "src/cache/cache.module";
import { FriendModule } from "src/friend/friend.module";
import { MemberModule } from "src/member/member.module";

@Module({
  imports: [forwardRef(() => UserModule), MessageModule, MemberModule, CacheModule, FriendModule, ChatlistModule, CGroupsModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule { }
