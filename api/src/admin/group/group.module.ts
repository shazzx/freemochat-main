import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from 'src/schema/group';
import { GroupsModule } from 'src/groups/groups.module';
import { JwtModule } from '@nestjs/jwt';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    GroupsModule,
    JwtModule,
    UploadModule,
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }])],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule { }
