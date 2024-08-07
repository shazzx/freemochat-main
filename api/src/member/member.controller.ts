import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { MemberService } from './member.service';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) { }

  @Get()
  async getMembers(@Req() req: Request, @Res() res: Response) {
    const { cursor, groupId } = req.query
    console.log(cursor, groupId)
    res.json(
      await this.memberService.getMembers(cursor, groupId)
    )
  }

  @Post("join")
  async toggleJoin(@Req() req) {
    const { groupDetails } = req.body
    const { username, sub } = req.user
    return await this.memberService.toggleJoin(sub, groupDetails)
  }


  @Post("toggleAdmin")
  async toggleAdmin(@Req() req) {
    const { groupId, userId, isChatGroup } = req.body
    const { username, sub } = req.user
    return await this.memberService.toggleAdmin(sub, userId, groupId, isChatGroup)
  }
}
