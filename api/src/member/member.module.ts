import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema, { Member } from 'src/schema/members';
import { JwtModule } from '@nestjs/jwt';
import { MetricsAggregatorModule } from 'src/metrics-aggregator/metrics-aggregator.module';
import { Group, GroupSchema } from 'src/schema/group';
import { ChatGroup, ChatGroupSchema } from 'src/schema/cgroup';
import { MessageModule } from 'src/message/message.module';
import { ChatlistModule } from 'src/chatlist/chatlist.module';

@Module({
  imports: [JwtModule,
    MetricsAggregatorModule,
    MessageModule,
    ChatlistModule,
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema }, 
      { name: Group.name, schema: GroupSchema }, 
      { name: ChatGroup.name, schema: ChatGroupSchema }
    ])],
  controllers: [MemberController],
  providers: [MemberService],
})
export class MemberModule { }
