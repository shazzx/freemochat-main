import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { jwtConstants } from './constants';
import { InjectModel } from '@nestjs/mongoose';
import { OTP } from 'src/schema/otp';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'
import { USER } from 'src/utils/enums/user.c';
import { OtpService } from 'src/otp/otp.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { compare } from 'bcrypt';
import { messageGenerator } from 'src/utils/messageGenerator';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private otpService: OtpService,
        private readonly twilioService: TwilioService,
        private readonly redisService: CacheService,
        @InjectModel(OTP.name) private readonly otpModel: Model<OTP>
    ) { }

    async validateUser(username: string, password: string): Promise<any> {
        let user = await this.userService.findUser(username)
        if (!user) {
            throw new UnauthorizedException(USER.WRONG_DATA)
        }

        let isValidPassword = await compare(password, user.password)

        if (!isValidPassword) {
            throw new HttpException({ message: USER.WRONG_DATA, type: 'invalid credentials' }, HttpStatus.BAD_REQUEST)
        }

        let verification = {
            // phone: false
            email: false
        }

        if (!user.email && user.isPhoneVerified) {
            return user
        }

        if (user.isEmailVerified) {
            verification.email = true
        }

        // if (user.isPhoneVerified) {
        //     verification.phone = true
        // }

        if (verification.email) {
            return user
        }

        if (!user.tempSecret) {
            let tempSecret = uuidv4()
            let emailOTP = await this.otpService.generateOtp(user._id, 'email')
            // {Phone OTP Starts Here}
            // let phoneOTP = await this.otpService.generateOtp(user._id, 'phone')
            // console.log(phoneOTP)
            // await this.twilioService.sendSMS(user.phone, message)
            // {Phone OTP Ends Here}

            const message = messageGenerator(user.firstname + " " + user?.lastname, emailOTP)

            await this.twilioService.sendEmail({
                to: user.email,
                from: process.env.VERIFY_EMAIL,
                subject: "OTP Verification",
                text: message,
                // html: emailData.html,
            })
            console.log(message)

            await this.userService.updateUser(user._id, { tempSecret: tempSecret })
            throw new HttpException({ message: USER.NOT_VERIFIED, type: USER.NOT_VERIFIED, user: { username, auth_id: tempSecret }, verification }, HttpStatus.BAD_REQUEST)
        }
        let emailOTP = await this.otpService.generateOtp(user._id, 'email')
        // let phoneOTP = await this.otpService.generateOtp(user._id, 'phone')
        // await this.twilioService.sendSMS(user.phone, message)
        const message = messageGenerator(user.firstname + " " + user?.lastname, emailOTP)

        await this.twilioService.sendEmail({
            to: user.email,
            from: process.env.VERIFY_EMAIL,
            subject: "OTP Verification",
            text: message,
            // html: emailData.html,
        })

        throw new HttpException({ message: USER.NOT_VERIFIED, type: USER.NOT_VERIFIED, user: { username, auth_id: user.tempSecret }, verification }, HttpStatus.BAD_REQUEST)
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user._id }
        const refresh_token = this.jwtService.sign(payload, { secret: jwtConstants.secret, expiresIn: '72h' })
        await this.redisService.setUserRefreshToken(user._id, refresh_token)
        return {
            user,
            access_token: this.jwtService.sign(payload, { secret: jwtConstants.secret, expiresIn: '48h' }),
        }
    }

    async accessToken({ username, userId }: { username: string, userId: string }) {
        return this.jwtService.sign({ username, sub: userId }, { secret: jwtConstants.secret, expiresIn: '48h' })
    }

    async refreshToken(token) {
        try {
            const payload = await this.jwtService.decode(token)
            const refresh_token = await this.redisService.getUserRefreshToken(payload.sub)
            const { username, sub } = this.jwtService.verify(refresh_token, { secret: jwtConstants.secret })
            const access_token = this.jwtService.sign({ username, sub }, { secret: jwtConstants.secret, expiresIn: '100h' })
            return access_token
        } catch (error) {
            return false
        }
    }

    async otpEmailVerification(userId: string, otpData: { code: string }) {
        const otp = await this.otpModel.findOne({ user: userId })
        if (!otp) {
            throw new BadRequestException()
        }

        if (otp.email === otpData.code) {
            return true
        }
        return false
    }

    async otpPhoneVerification(userId: string, otpData: { code: number }) {
        const otp = await this.otpModel.findOne({ user: userId })
        if (!otp) {
            throw new BadRequestException()
        }

        if (otp.phone === otpData.code) {
            return true
        }
        return false
    }
}
