import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { AccountManagementModule } from 'src/account-management/account-management.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { OTP, OTPSchema } from 'src/schema/otp';
import { OtpModule } from 'src/otp/otp.module';
import { CacheModule } from 'src/cache/cache.module';
import { TwilioModule } from 'src/twilio/twilio.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    MongooseModule.forFeature([{name: OTP.name, schema: OTPSchema}]),
    AccountManagementModule,
    CacheModule,
    TwilioModule,
    OtpModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1200m' }
    })
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule]
})
export class AuthModule { }
