import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { MemberService } from './member.service';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { GetMembers, GetMembersDTO, ToggleAdmin, ToggleAdminDTO } from 'src/schema/validation/member';
import { JoinGroup, JoinGroupDTO } from 'src/schema/validation/chatgroup';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) { }

  @Get()
  async getMembers(@Query(new ZodValidationPipe(GetMembers)) getMembersDTO: GetMembersDTO, @Req() req: Request, @Res() res: Response) {
    const { cursor, groupId } = getMembersDTO
    console.log(cursor, groupId)
    
    res.json(
      await this.memberService.getMembers(cursor, groupId)
    )
  }

  @Post("join")
  async toggleJoin(@Body(new ZodValidationPipe(JoinGroup)) joinGroupDTO: JoinGroupDTO, @Req() req) {
    const { groupDetails } = joinGroupDTO
    const { sub } = req.user
    return await this.memberService.toggleJoin(sub, groupDetails)
  }


  @Post("toggleAdmin")
  async toggleAdmin(@Body(new ZodValidationPipe(ToggleAdmin)) toggleAdminDTO: ToggleAdminDTO, @Req() req) {
    const { groupId, userId, isChatGroup } = toggleAdminDTO
    const { sub } = req.user
    return await this.memberService.toggleAdmin(sub, userId, groupId, isChatGroup)
  }
}
