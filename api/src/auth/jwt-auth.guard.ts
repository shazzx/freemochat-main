
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';
import { AccountManagementService } from 'src/account-management/account-management.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService, private reflector: Reflector, private accountManagementService: AccountManagementService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isAdminRoute = this.reflector.getAllAndOverride<boolean>('isAdminRoute', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isAdminRoute) {
            return true;
        }

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])

        if (isPublic) {
            return true
        }
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            console.log('not token')
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: jwtConstants.secret
                }
            );

            console.log(payload, 'payload auth guard')
            if(!payload){
                return false
            }

            let accountStatus = await this.accountManagementService.getAccountStatus(payload.sub)
            console.log(accountStatus)

            if (accountStatus?.isSuspended) {
                throw new UnauthorizedException("Your account is suspended please contact customer support")
            }

            if (!accountStatus?.isActive) {
                throw new UnauthorizedException("Your Account is Deactive. Please Contact Customer Support")
            }

            request['user'] = payload;
            
        } catch(err) {
            throw new UnauthorizedException(err.message);
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}