import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserChatListService } from './chatlist.service';

@Controller('chatlist')
export class ChatlistController {
    constructor(private readonly chatlistService: UserChatListService) { }

    @Get("")
    async getChatLists(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user as { username: string, sub: string }
        response.json(await this.chatlistService.getChatLists(sub))
    }

    @Post("remove")
    async removeChatList(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user as { username: string, sub: string }
        const { recepientId } = req.body
        response.json(await this.chatlistService.removeChat(sub, recepientId))
    }
}
