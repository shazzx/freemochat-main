import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
import { Request, Response } from 'express';
import { IsAdminRoute } from '../utils/isAdminRoute.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
export class GroupController {
  constructor(private readonly groupService: GroupService, private userGroupService: GroupService) { }

  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Get("groups")
  async getPages(@Req() req: Request, @Res() response: Response) {
    const { cursor, search } = req.params
    console.log('groups')
    response.json(await this.groupService.getGroups(cursor, search))
  }


  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Post("group/remove")
  async removePage(@Req() req: Request, @Res() response: Response) {
    const { groupId } = req.body
    response.json(await this.userGroupService.deleteGroup(groupId))
  }
}
