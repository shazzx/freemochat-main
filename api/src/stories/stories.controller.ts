import { Controller, Get, Post, Res, UseInterceptors, Body, Req, UploadedFile, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { Request, Response } from 'express';
import { UploadService } from 'src/upload/upload.service';
import { v4 as uuidv4 } from 'uuid'
import { getFileType } from 'src/utils/getFileType';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { DeleteStory, DeleteStoryDTO } from 'src/schema/validation/stories';

@Controller('stories')
export class StoriesController {
    constructor(private storiesService: StoriesService, private uploadService: UploadService) { }

    @Get()
    async getStories(@Req() req, @Res() res: Response) {
        res.json(await this.storiesService.getStories(req.user.sub, req.user.username))
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post("create")
    async createStory(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File) {
        const { sub } = req.user as { sub: string, username: string }
        const fileType = getFileType(file.mimetype)
        const filename = uuidv4()

        let { url } = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
        console.log(url)

        res.json(await this.storiesService.createStory(sub, { url }))
    }

    // @Post("update")
    // async updateStory(@Body(new ZodValidationPipe(UpdateStory)) updateStoryDTO: UpdateStoryDTO, @Req() req) {
    //     const { userDetails, storyDetails } = req.body
    //     return await this.storiesService.updateStory(userDetails.username, storyDetails)
    // }

    @Post("delete")
    async deleteStory(@Body(new ZodValidationPipe(DeleteStory)) deleteStoryDTO: DeleteStoryDTO, @Req() req: Request, @Res() res: Response) {
        const {sub} = req.user as {sub: string}
        const { storyId, url } = deleteStoryDTO
        const deleted =  await this.storiesService.deleteStory(storyId, sub)

        if(deleted){
        let imageUrlSplit = url.split("/")
        let filename = imageUrlSplit[imageUrlSplit.length - 1]
        await this.uploadService.deleteFromS3(filename)
        res.json(deleted)
        return 
        }

        throw new BadRequestException("something went wrong")
    }
}
