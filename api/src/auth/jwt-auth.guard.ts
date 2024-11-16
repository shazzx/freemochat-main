
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request, Response } from 'express';
import { AccountManagementService } from 'src/account-management/account-management.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
        private accountManagementService: AccountManagementService,
        private cacheService: CacheService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isAdminRoute = this.reflector.getAllAndOverride<boolean>('isAdminRoute', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isAdminRoute) {
            console.log('yes true admin route')
            return true;
        }

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])

        if (isPublic) {
            return true
        }
        const request = context.switchToHttp().getRequest();
        const response: Response = context.switchToHttp().getResponse();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: jwtConstants.secret
                }
            );

            // // console.log(payload, 'payload auth guard')
            // if (!payload) {
            //     return false
            // }

            // let refresh_token = await this.cacheService.getUserRefreshToken(payload.sub)
            // const valid_refresh_token = await this.jwtService.verifyAsync(
            //     refresh_token,
            //     {
            //         secret: jwtConstants.secret
            //     }
            // );

            // if (!valid_refresh_token) {
            //     console.log(payload, 'no refresh token')
            //     return false
            // }

            let accountStatus = await this.accountManagementService.getAccountStatus(payload.sub)

            if (accountStatus?.isSuspended) {
                throw new UnauthorizedException("Your account is suspended please contact customer support")
            }

            if (!accountStatus?.isActive) {
                throw new UnauthorizedException("Your Account is Deactive. Please Contact Customer Support")
            }

            request['user'] = payload;

        } catch (err) {
            if (err instanceof TokenExpiredError) {
                console.log('yes token expired error')
                const _token = await this.jwtService.decode(token)
                const refreshToken = await this.cacheService.getUserRefreshToken(_token.sub)
                if (!refreshToken) {
                    throw new UnauthorizedException(err.message);
                }

                const refreshToken_payload = await this.jwtService.verify(refreshToken)

                request['user'] = refreshToken_payload

                const access_token = this.jwtService.sign({ username: refreshToken_payload.username, sub: refreshToken_payload.sub }, { secret: jwtConstants.secret, expiresIn: '1m' })


                response.cookie("accessToken", access_token, {
                    sameSite: 'strict',
                    maxAge: 5 * 60 * 1000
                })
                return true
            }
            throw new UnauthorizedException(err.message);
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}