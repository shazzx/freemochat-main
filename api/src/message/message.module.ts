import { forwardRef, Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/schema/message';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { UploadModule } from 'src/upload/upload.module';
import { ChatlistModule } from 'src/chatlist/chatlist.module';
import { ChatModule } from 'src/chat/chat.module';
import { MessageSoftDelete, MessageSoftDeleteSchema } from 'src/schema/chatsoftdelete';

@Module({
  imports: [AuthModule, forwardRef(() => ChatModule), ChatlistModule, forwardRef(() => UploadModule), JwtModule, MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }, { name: MessageSoftDelete.name, schema: MessageSoftDeleteSchema }])],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService]
})
export class MessageModule { }
