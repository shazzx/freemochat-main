import { Controller, Post, Req, Res } from '@nestjs/common';
import { AccountManagementService } from './account-management.service';
import { Response } from 'express'


@Controller('account-management')
export class AccountManagementController {
  constructor(private readonly accountManagementService: AccountManagementService) { }

  @Post("suspend")
  async createUser(@Req() req, @Res() response: Response) {
    const { userId, reason } = req.body
    response.json(await this.accountManagementService.toggleSuspendUser(userId, reason))
  }
}
