import { BadRequestException, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
import { Request, Response } from 'express';
import { IsAdminRoute } from '../utils/isAdminRoute.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from 'src/upload/upload.service';

@Controller('admin')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly userGroupService: GroupService,
    private readonly uploadService: UploadService
  ) { }

  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Get("groups")
  async getPages(@Req() req: Request, @Res() response: Response) {
    const { cursor, search } = req.query as {cursor: string, search: string}
    response.json(await this.groupService.getGroups(cursor, search))
  }


  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Post("group/remove")
  async removePage(@Req() req: Request, @Res() res: Response) {
    const { groupId } = req.body

    const group = await this.groupService.getGroup(groupId)

    if(!group){
      throw new BadRequestException()
    }
   
    let images = []

    if(group?.profile){
      images.push(group.profile)
    }

    if(group?.cover){
      images.push(group.cover)
    }

    if (images.length > 0) {
        for (let i = 0; i < images.length -1 ; i++) {
            let imageUrlSplit = images[i].split("/")
            let filename = imageUrlSplit[imageUrlSplit.length - 1]
            let deleted = await this.uploadService.deleteFromS3(filename)
        }
    }
    res.json(await this.userGroupService.deleteGroup(groupId))
  }
}
