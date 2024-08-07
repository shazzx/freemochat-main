import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { PageService } from './page.service';
import { PageService as UserPageService } from 'src/pages/pages.service';
import { Request, Response } from 'express';
import { IsAdminRoute } from '../utils/isAdminRoute.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
export class PageController {
  constructor(private readonly pageService: PageService, private userPageService: UserPageService) { }

  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Get("pages")
  async getPages(@Req() req: Request, @Res() response: Response) {
    const { cursor, search } = req.params
    response.json(await this.pageService.getPages(cursor, search))
  }


  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Post("page/remove")
  async removePage(@Req() req: Request, @Res() response: Response) {
    const {pageId } = req.body
    response.json(await this.userPageService.deletePage(pageId))
  }
}
