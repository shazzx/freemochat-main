import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/user';
import { UserModule as _UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AccountManagementModule } from 'src/account-management/account-management.module';

@Module({
  imports: [_UserModule, JwtModule, AccountManagementModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule { }
