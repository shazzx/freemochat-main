import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { compare } from 'bcrypt'
import { jwtConstants } from './constants';
import { InjectModel } from '@nestjs/mongoose';
import { OTP } from 'src/schema/otp';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService, 
        private jwtService: JwtService,
        @InjectModel(OTP.name) private readonly otpModel: Model<OTP>
    ) { }

    async validateUser(username: string, password: string): Promise<any> {
        let user: any = await this.userService.findUser(username)
        if (!user) {
            throw new UnauthorizedException()
        }

        let isValidPassword = await compare(password, user.password)

        if (!isValidPassword) {
            throw new UnauthorizedException()
        }

        return user
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
