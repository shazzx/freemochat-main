import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { FollowerService } from './follower.service';
import { Request, Response } from 'express';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { GetFollowers, GetFollowersDTO } from 'src/schema/validation/follower';

@Controller('followers')
export class FollowerController {
  constructor(private readonly followerService: FollowerService) { }

  @Get()
  async getFollowers(@Query(new ZodValidationPipe(GetFollowers)) getFollowersDTO: GetFollowersDTO, @Req() req: Request, @Res() res: Response) {
    const { cursor, targetId, type } = getFollowersDTO
    let _targetId: string;
    if (!targetId) {
      const { sub } = req.user as { sub: string, username: string }
      _targetId = sub
    }
    res.json(
      await this.followerService.getFollowers(cursor, targetId ? targetId : _targetId, type)
    )
  }
}
