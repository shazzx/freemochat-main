import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get()
  async notifications(@Req() req: Request, @Res() response: Response) {
    const { sub } = req.user as { sub: string, username: string }
    const { cursor } = req.query
    response.json(await this.notificationService.getNotifications(cursor, sub))
  }
}
