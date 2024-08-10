import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Friend, FriendSchema } from 'src/schema/friends';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [CacheModule, MongooseModule.forFeature([{ name: Friend.name, schema: FriendSchema }])],
  providers: [FriendService],
  exports: [FriendService],
})
export class FriendModule { }
