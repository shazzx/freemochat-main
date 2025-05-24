import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt'
import { jwtConstants } from '../utils/constants';
import { AdminService } from '../admin.service';

@Injectable()
export class AuthService {
    constructor(private adminService: AdminService, private jwtService: JwtService) { }

    async validateUser(username: string, password: string): Promise<any> {
        let user: any = await this.adminService.getAdmin(username)
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
            access_token: this.jwtService.sign(payload, {secret: jwtConstants.secret}),
            refresh_token: this.jwtService.sign(payload, {secret: jwtConstants.secret})
        }
    }

    async refreshToken(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token, { secret: jwtConstants.secret })
            const access_token = this.jwtService.sign({ username: payload.username, sub: payload.sub }, { secret: jwtConstants.secret, expiresIn: '120h' })
            return access_token
        } catch (error) {
            return false
        }
    }
}
