import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { CGroupService } from './cgroup.service';
import { Request, Response } from 'express';
import { CGroupsService } from 'src/cgroups/cgroups.service';
import { IsAdminRoute } from '../utils/isAdminRoute.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
export class CGroupController {
  constructor(private readonly cgroupService: CGroupService, private userChatGroupService: CGroupsService) { }

  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Get("chatgroups")
  async getPages(@Req() req: Request, @Res() response: Response) {
    const { cursor, search } = req.query as {cursor: string, search: string}
    response.json(await this.cgroupService.getChatGroups(cursor, search))
  }


  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Post("chatgroup/remove")
  async removePage(@Req() req: Request, @Res() response: Response) {
    const { groupId } = req.body
    response.json(await this.userChatGroupService.deleteGroup(groupId))
  }
}
