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

    private getTokenConfig() {
        const isTestMode = process.env.ENV === 'DEVELOPMENT';

        if (isTestMode) {
            return {
                accessTokenExpiry: '2m',
                refreshTokenExpiry: '10m',
                accessTokenSeconds: 2 * 60, 
                refreshTokenSeconds: 10 * 60
            };
        }

        return {
            accessTokenExpiry: '15m',        
            refreshTokenExpiry: '30d',       
            accessTokenSeconds: 15 * 60,    
            refreshTokenSeconds: 30 * 24 * 60 * 60 
        };
    }

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
            email: false
        }

        if (!user.email && user.isPhoneVerified) {
            return user
        }

        if (user.isEmailVerified) {
            verification.email = true
        }

        if (verification.email) {
            return user
        }

        if (!user.tempSecret) {
            let tempSecret = uuidv4()
            let emailOTP = await this.otpService.generateOtp(user._id, 'email')

            const message = messageGenerator(user.firstname + " " + user?.lastname, emailOTP)

            await this.twilioService.sendEmail({
                to: user.email,
                from: process.env.VERIFY_EMAIL,
                subject: "OTP Verification",
                text: message,
            })

            await this.userService.updateUser(user._id, { tempSecret: tempSecret })
            throw new HttpException({ message: USER.NOT_VERIFIED, type: USER.NOT_VERIFIED, user: { username, auth_id: tempSecret }, verification }, HttpStatus.BAD_REQUEST)
        }

        let emailOTP = await this.otpService.generateOtp(user._id, 'email')
        const message = messageGenerator(user.firstname + " " + user?.lastname, emailOTP)

        await this.twilioService.sendEmail({
            to: user.email,
            from: process.env.VERIFY_EMAIL,
            subject: "OTP Verification",
            text: message,
        })

        throw new HttpException({ message: USER.NOT_VERIFIED, type: USER.NOT_VERIFIED, user: { username, auth_id: user.tempSecret }, verification }, HttpStatus.BAD_REQUEST)
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user._id }
        const tokenConfig = this.getTokenConfig();

        const access_token = this.jwtService.sign(payload, {
            secret: jwtConstants.secret,
            expiresIn: tokenConfig.accessTokenExpiry
        })

        const refresh_token = this.jwtService.sign(payload, {
            secret: jwtConstants.secret,
            expiresIn: tokenConfig.refreshTokenExpiry
        })

        await this.redisService.setUserRefreshToken(user._id, refresh_token)

        console.log(`🔑 Tokens created for user ${user.username}:`, {
            accessTokenExpiry: tokenConfig.accessTokenExpiry,
            refreshTokenExpiry: tokenConfig.refreshTokenExpiry,
            isTestMode: process.env.NODE_ENV === 'test' || process.env.TOKEN_TEST_MODE === 'true'
        });

        return {
            user,
            access_token,
            refresh_token,
            expires_in: tokenConfig.accessTokenSeconds,
            refresh_expires_in: tokenConfig.refreshTokenSeconds, 
            token_type: 'Bearer',
            ...(process.env.NODE_ENV === 'test' && {
                testing_info: {
                    access_expires_at: new Date(Date.now() + tokenConfig.accessTokenSeconds * 1000).toISOString(),
                    refresh_expires_at: new Date(Date.now() + tokenConfig.refreshTokenSeconds * 1000).toISOString()
                }
            })
        }
    }

    async accessToken({ username, userId }: { username: string, userId: string }) {
        const tokenConfig = this.getTokenConfig();
        return this.jwtService.sign({ username, sub: userId }, {
            secret: jwtConstants.secret,
            expiresIn: tokenConfig.accessTokenExpiry
        })
    }

    async refreshToken(token: string) {
        try {
            const tokenConfig = this.getTokenConfig();
            const payload = await this.jwtService.decode(token)
            const stored_refresh_token = await this.redisService.getUserRefreshToken(payload.sub)

            if (!stored_refresh_token || stored_refresh_token !== token) {
                console.log(`❌ Refresh token mismatch for user ${payload.sub}`);
                throw new UnauthorizedException('Invalid refresh token')
            }

            const { username, sub } = this.jwtService.verify(stored_refresh_token, { secret: jwtConstants.secret })

            const new_access_token = this.jwtService.sign({ username, sub }, {
                secret: jwtConstants.secret,
                expiresIn: tokenConfig.accessTokenExpiry
            })

            const new_refresh_token = this.jwtService.sign({ username, sub }, {
                secret: jwtConstants.secret,
                expiresIn: tokenConfig.refreshTokenExpiry
            })

            await this.redisService.setUserRefreshToken(sub, new_refresh_token)

            console.log(`🔄 Token refreshed for user ${username}:`, {
                oldTokenHash: token.substring(0, 10) + '...',
                newTokenHash: new_access_token.substring(0, 10) + '...',
                expiresIn: tokenConfig.accessTokenSeconds
            });

            return {
                access_token: new_access_token,
                refresh_token: new_refresh_token,
                expires_in: tokenConfig.accessTokenSeconds,
                refresh_expires_in: tokenConfig.refreshTokenSeconds,
                token_type: 'Bearer',
                ...(process.env.NODE_ENV === 'test' && {
                    refreshed_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + tokenConfig.accessTokenSeconds * 1000).toISOString()
                })
            }
        } catch (error) {
            console.error('❌ Token refresh failed:', error.message);
            throw new UnauthorizedException('Token refresh failed')
        }
    }

    async mobileRefreshToken(refresh_token: string) {
        if (!refresh_token) {
            throw new UnauthorizedException('Refresh token is required');
        }

        try {
            const result = await this.refreshToken(refresh_token);

            return {
                ...result,
                mobile_specific: {
                    should_retry: false,
                    next_refresh_in: Math.floor(result.expires_in * 0.8),
                    server_time: Date.now()
                }
            };
        } catch (error) {
            if (error.message.includes('jwt expired')) {
                throw new UnauthorizedException({
                    message: 'Refresh token expired',
                    code: 'REFRESH_TOKEN_EXPIRED',
                    should_logout: true
                });
            }

            throw error;
        }
    }

    async validateTokenSilently(token: string): Promise<{ valid: boolean, payload?: any, error?: string }> {
        try {
            const payload = this.jwtService.verify(token, { secret: jwtConstants.secret });
            return { valid: true, payload };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    async getTokenInfo(token: string) {
        if (process.env.NODE_ENV !== 'test') {
            throw new UnauthorizedException('This endpoint is only available in test mode');
        }

        try {
            const decoded = this.jwtService.decode(token, { json: true });
            const validation = await this.validateTokenSilently(token);

            return {
                decoded,
                isValid: validation.valid,
                error: validation.error,
                expiresAt: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null,
                issuedAt: decoded?.iat ? new Date(decoded.iat * 1000).toISOString() : null,
                timeUntilExpiry: decoded?.exp ? Math.max(0, decoded.exp - Math.floor(Date.now() / 1000)) : null
            };
        } catch (error) {
            return {
                error: error.message,
                isValid: false
            };
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