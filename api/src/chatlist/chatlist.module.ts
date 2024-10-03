import { Module } from '@nestjs/common';
import { UserChatListService } from './chatlist.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatlistController } from './chatlist.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { User, UserSchema } from 'src/schema/user';
import { ChatItem, ChatItemSchema } from 'src/schema/chatlist.schema';
import { CacheModule } from 'src/cache/cache.module';
import { MessageSoftDelete, MessageSoftDeleteSchema } from 'src/schema/chatsoftdelete';

@Module({
  imports: [JwtModule, CacheModule, AuthModule, MongooseModule.forFeature([{ name: ChatItem.name, schema: ChatItemSchema }, { name: MessageSoftDelete.name, schema: MessageSoftDeleteSchema }])],
  exports: [UserChatListService],
  providers: [UserChatListService],
  controllers: [ChatlistController],
})
export class ChatlistModule { }
