import { forwardRef, Module } from '@nestjs/common';
import { AccountManagementService } from './account-management.service';
import { AccountManagementController } from './account-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/user';
import { Suspension, SuspensionSchema } from 'src/schema/Suspension';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, { name: Suspension.name, schema: SuspensionSchema }])],
  controllers: [AccountManagementController],
  providers: [AccountManagementService],
  exports: [AccountManagementService]
})
export class AccountManagementModule { }
