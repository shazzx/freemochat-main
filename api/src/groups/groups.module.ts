import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from 'src/schema/group';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import MemberSchema, { Member } from 'src/schema/members';
import { UploadModule } from 'src/upload/upload.module';
import counterSchema, { Counter } from 'src/schema/Counter';
import { MetricsAggregatorModule } from 'src/metrics-aggregator/metrics-aggregator.module';

@Module({
  imports: [UserModule, MetricsAggregatorModule, JwtModule, AuthModule, UploadModule, MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }, { name: Member.name, schema: MemberSchema }])],
  providers: [GroupsService],
  controllers: [GroupsController],
  exports: [GroupsService]
})
export class GroupsModule { }
