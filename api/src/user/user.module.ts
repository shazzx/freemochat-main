import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/user';
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import FriendRequestsSchema, { FriendRequest } from 'src/schema/friendrequests';
import { Friend, FriendSchema } from 'src/schema/friends';
import FollowerSchema, { Follower } from 'src/schema/followers';
import { UploadModule } from 'src/upload/upload.module';
import { MetricsAggregatorModule } from 'src/metrics-aggregator/metrics-aggregator.module';
import { OtpModule } from 'src/otp/otp.module';
import { CryptoModule } from 'src/crypto/crypto.module';
import { Countries, CountriesSchema } from 'src/schema/countries';
import { Cities, CitiesSchema } from 'src/schema/cities';
import { LocationModule } from 'src/location/location.module';

@Module({
  imports: [
    JwtModule,
    AuthModule,
    OtpModule,
    CryptoModule,
    MetricsAggregatorModule,
    LocationModule,
    forwardRef(() => UploadModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: FriendRequest.name, schema: FriendRequestsSchema },
      { name: Friend.name, schema: FriendSchema },
      { name: Follower.name, schema: FollowerSchema },
    ])],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule { }
