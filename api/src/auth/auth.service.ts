import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { compare } from 'bcrypt'
import { jwtConstants } from './constants';
import { InjectModel } from '@nestjs/mongoose';
import { OTP } from 'src/schema/otp';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'
import { USER } from 'src/utils/enums/user.c';
import { OtpService } from 'src/otp/otp.service';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService, 
        private jwtService: JwtService,
        private otpService: OtpService,
        @InjectModel(OTP.name) private readonly otpModel: Model<OTP>
    ) { }

    async validateUser(username: string, password: string): Promise<any> {
        let user = await this.userService.findUser(username)
        if (!user) {
            throw new UnauthorizedException(USER.WRONG_DATA)
        }

        let isValidPassword = await compare(password, user.password)

        if (!isValidPassword) {
            throw new HttpException({message: USER.WRONG_DATA, type: 'invalid credentials'}, HttpStatus.BAD_REQUEST)
        }

        let verification = {
            email: false,
            phone: false
        }

        if(user.isEmailVerified){
            verification.email = true
        }

        if(user.isPhoneVerified){
            verification.phone = true
        }

        if(verification.email && verification.phone){
            return user
        }
        if(!user.tempSecret){
            let tempSecret = uuidv4()
            await this.userService.updateUser(user._id,{tempSecret: tempSecret})
            throw new HttpException({message: USER.NOT_VERIFIED, type: USER.NOT_VERIFIED, user: {username, auth_id: user.tempSecret} , verification}, HttpStatus.BAD_REQUEST)
        }
        let emailOTP = await this.otpService.generateOtp(user._id, 'email')
        let phoneOTP = await this.otpService.generateOtp(user._id, 'phone')
        console.log(emailOTP, phoneOTP)

        throw new HttpException({message: USER.NOT_VERIFIED, type: USER.NOT_VERIFIED, user: {username, auth_id: user.tempSecret}, verification}, HttpStatus.BAD_REQUEST)

    }

    async login(user: any) {
        const payload = { username: user.username, sub: user._id }
        return {
            user,
            access_token: this.jwtService.sign(payload),
            refresh_token: this.jwtService.sign(payload)
        }
    }

    async refreshToken(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token, { secret: jwtConstants.secret })
            const access_token =  this.jwtService.sign({username: payload.username, sub: payload.sub}, {secret: jwtConstants.secret, expiresIn: '1h'})
            return access_token
        } catch (error) {
            console.log(error)
            return false
        }
    }

    async otpEmailVerification(userId, otpData) {
        const otp = await this.otpModel.findOne({user: userId})
        if(!otp){
            throw new BadRequestException()
        }

        if(otp.email === otpData.code){
            return true
        }
        return false
    }


    async otpPhoneVerification(userId, otpData) {
        const otp = await this.otpModel.findOne({user: userId})
        if(!otp){
            throw new BadRequestException()
        }

        if(otp.phone === otpData.code){
            return true
        }
        return false
    }
}
