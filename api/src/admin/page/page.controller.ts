import { BadRequestException, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { PageService } from './page.service';
import { PageService as UserPageService } from 'src/pages/pages.service';
import { Request, Response } from 'express';
import { IsAdminRoute } from '../utils/isAdminRoute.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from 'src/upload/upload.service';

@Controller('admin')
export class PageController {
  constructor(
    private readonly pageService: PageService, 
    private readonly uploadService: UploadService
  ) { }

  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Get("pages")
  async getPages(@Req() req: Request, @Res() response: Response) {
    const { cursor, search } = req.query as {cursor: string, search: string}
    response.json(await this.pageService.getPages(cursor, search))
  }


  @UseGuards(JwtAuthGuard)
  @IsAdminRoute()
  @Post("page/remove")
  async removePage(@Req() req: Request, @Res() res: Response) {
    const { pageId } = req.body

    const page = await this.pageService.getPage(pageId)

    if(!page){
      throw new BadRequestException()
    }
   
    let images = []

    if(page?.profile){
      images.push(page.profile)
    }

    if(page?.cover){
      images.push(page.cover)
    }

    if (images.length > 0) {
        for (let i = 0; i < images.length -1 ; i++) {
            let imageUrlSplit = images[i].split("/")
            let filename = imageUrlSplit[imageUrlSplit.length - 1]
            let deleted = await this.uploadService.deleteFromS3(filename)
            console.log(deleted)
        }
    }
    res.json(await this.pageService.deletePage(pageId))
  }
}
