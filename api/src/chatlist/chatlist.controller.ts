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

    @Post("messagesSeen")
    async chatListMessagesSeen(@Req() req: Request, @Res() response: Response) {
        const { chatlistId, recepientId } = req.body
        response.json(await this.chatlistService.messagesSeen(chatlistId, recepientId))
    }

    @Post("remove")
    async removeChatList(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user as { username: string, sub: string }
        const { recepientId, lastMessageId } = req.body
        console.log(lastMessageId, 'lastmessageid')
        response.json(await this.chatlistService.removeChat(sub, recepientId, lastMessageId))
    }
}
