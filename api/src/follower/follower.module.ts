import { Module } from '@nestjs/common';
import { FollowerService } from './follower.service';
import { FollowerController } from './follower.controller';
import { MongooseModule } from '@nestjs/mongoose';
import FollowerSchema, { Follower } from 'src/schema/followers';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule, MongooseModule.forFeature([{ name: Follower.name, schema: FollowerSchema }])],
  controllers: [FollowerController],
  providers: [FollowerService],
  exports: [FollowerService]
})
export class FollowerModule { }
