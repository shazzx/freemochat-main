import { forwardRef, Module } from '@nestjs/common';
import { CGroupsController } from './cgroups.controller';
import { CGroupsService } from './cgroups.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGroup, ChatGroupSchema } from 'src/schema/cgroup';
import { ChatlistModule } from 'src/chatlist/chatlist.module';
import { UploadModule } from 'src/upload/upload.module';
import { MessageModule } from 'src/message/message.module';
import { MetricsAggregatorModule } from 'src/metrics-aggregator/metrics-aggregator.module';

@Module({
  imports: [
    AuthModule, 
    forwardRef(() => UploadModule), 
    ChatlistModule, 
    JwtModule,
    MetricsAggregatorModule, 
    MongooseModule.forFeature([{ name: ChatGroup.name, schema: ChatGroupSchema }]),
    MessageModule,
  ],
  controllers: [CGroupsController],
  providers: [CGroupsService],
  exports: [CGroupsService]
})
export class CGroupsModule { }
