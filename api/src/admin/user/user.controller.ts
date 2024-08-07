import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { UserService as AdminUserService } from './user.service';
import { UserService } from '../../user/user.service';
import { Request, Response } from 'express';
import { IsAdminRoute } from '../utils/isAdminRoute.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
export class UserController {
  constructor(private readonly adminUserService: AdminUserService, private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Get("users")
  async getUsers(@Req() req: Request, @Res() response: Response) {
    const { cursor, search } = req.query as { cursor: string, search: string }
    console.log(req.query)
    const users = await this.adminUserService.getUsers(cursor, search)
    response.json(users)
  }

  @IsAdminRoute()
  @Post("user/remove")
  async removeUser(@Req() req: Request, @Res() response: Response) {
    const { userId } = req.body
    console.log(userId)
    response.json(await this.userService.deleteUser(userId))
  }

}
