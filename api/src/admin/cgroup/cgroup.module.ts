import { Module } from '@nestjs/common';
import { CGroupService } from './cgroup.service';
import { CGroupController } from './cgroup.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGroup, ChatGroupSchema } from 'src/schema/cgroup';
import { CGroupsModule } from 'src/cgroups/cgroups.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [CGroupsModule, JwtModule, MongooseModule.forFeature([{ name: ChatGroup.name, schema: ChatGroupSchema }])],
  controllers: [CGroupController],
  providers: [CGroupService],
})
export class CGroupModule { }
