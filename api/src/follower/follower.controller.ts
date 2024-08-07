import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { FollowerService } from './follower.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request, Response } from 'express';

@Controller('followers')
export class FollowerController {
  constructor(private readonly followerService: FollowerService) { }

  @Get()
  // @UseGuards(JwtAuthGuard)
  async getFollowers(@Req() req: Request, @Res() res: Response) {
    const { cursor, targetId, type } = req.query
    let _targetId;
    if (!targetId) {
      const { sub } = req.user as { sub: string, username: string }
      _targetId = sub
    }
    res.json(
      await this.followerService.getFollowers(cursor, targetId ? targetId : _targetId, type)
    )
  }
}
