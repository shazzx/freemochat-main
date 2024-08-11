import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserChatListService } from './chatlist.service';

@Controller('chatlist')
export class ChatlistController {
    constructor(private readonly chatlistService: UserChatListService) { }

    @Get("")
    async getChatList(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user as { username: string, sub: string }
        response.json(await this.chatlistService.getChatLists(sub))
    }

}
