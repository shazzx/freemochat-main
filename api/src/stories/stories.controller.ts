import { Controller, UseGuards, Get, Post, Res, UseInterceptors, Body, Req, UploadedFile } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { StoriesService } from './stories.service';
import { Request, Response } from 'express';
import { UploadService } from 'src/upload/upload.service';
import { v4 as uuidv4 } from 'uuid'
import { getFileType } from 'src/utils/getFileType';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('stories')
export class StoriesController {
    constructor(private storiesService: StoriesService, private uploadService: UploadService) { }

    @Get()
    async getStories(@Req() req, @Res() res: Response) {
        res.json(await this.storiesService.getStories(req.user.sub, req.user.username))
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post("create")
    async createStory(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File,
        @Body("storyData") storyData) {
        const { sub } = req.user as { sub: string, username: string }
        const fileType = getFileType(file.mimetype)
        const filename = uuidv4()
        let url = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)

        res.json(await this.storiesService.createStory(sub, { url }))
    }

    @Post("update")
    async updateStory(@Req() req) {
        const { userDetails, storyDetails } = req.body
        return await this.storiesService.updateStory(userDetails.username, storyDetails)
    }

    @Post("delete")
    async deleteStory(@Req() req) {
        const { userDetails, storyDetails } = req.body
        return await this.storiesService.deleteStory(userDetails.username, storyDetails)
    }
}
