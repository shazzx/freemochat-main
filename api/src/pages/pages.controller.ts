import { Body, Controller, Get, Post, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PageService } from './pages.service';
import { Request, Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'
import { UploadService } from 'src/upload/upload.service';


@Controller('page')
export class PageController {
    constructor(private pageService: PageService, private readonly uploadService: UploadService) {

    }

    // @UseGuards(JwtAuthGuard)
    @Get()
    async getPage(@Req() req, @Res() res: Response) {
        const { handle } = req.query
        const { sub } = req.user
        const page = await this.pageService.getPage(handle, sub)
        res.json(page)

    }


    // @UseGuards(JwtAuthGuard)
    @Post("follow")
    async followPage(@Req() req) {
        const { pageDetails} = req.body
        const { username, sub } = req.user
        return await this.pageService.toggleFollow(sub, pageDetails)
    }

    // @UseGuards(JwtAuthGuard)
    @Get("all")
    async getPages(@Req() req) {
        return await this.pageService.getPages(req.user.sub)
    }


    // @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('files'))
    @Post("create")
    async createPage(@Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[],
        @Body("pageData") pageData: string,
        resposne: Response) {
        console.log("files :", files, pageData)
        let { pageDetails } = JSON.parse(pageData)

        // let media = {
        //     images: [],
        //     videos: []
        // }

        let images;
        for (let file of files) {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            console.log(file)
            let uploaded = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
            console.log(uploaded)
            if (file.originalname == 'profile') {
                images = { ...images, profile: uploaded }
            }
            if (file.originalname == 'cover') {
                images = { ...images, cover: uploaded }
            }
        }

        console.log(images)

        const { username, sub } = req.user as { username: string, sub: string }

        // await this.uploadService.storeMedia({ username, userId: sub }, media)
        res.json(await this.pageService.createPage({ username, sub }, { ...pageDetails, images }))
    }


    // @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('files'))
    @Post("update")
    async updatePage(@Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[],
        @Body("pageData") pageData: string,
        resposne: Response) {
        let { pageDetails, pageId, images } = JSON.parse(pageData)

        let _images;
        for (let file of files) {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            console.log(file)
            let uploaded = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
            console.log(uploaded)
            if (file.originalname == 'profile') {
                _images = { ..._images, profile: uploaded }
            }
            if (file.originalname == 'cover') {
                _images = { ..._images, cover: uploaded }
            }
        }

        res.json(await this.pageService.updatePage(pageId, { ...pageDetails, images: { ...images, ..._images }, }))
    }

    // @UseGuards(JwtAuthGuard)
    @Get("handleExists")
    async handleExists(@Req() req: Request, @Res() res: Response) {
        const { handle } = req.query as { handle: string }
        res.json(await this.pageService.handleExists(handle))
    }

    // @UseGuards(JwtAuthGuard)
    @Post("delete")
    async deletePage(@Req() req) {
        const { pageDetails } = req.body
        const { username }: { username?: string } = req.user
        console.log(pageDetails)
        if (pageDetails.images) {
            const { images } = pageDetails
            console.log(images)
            for (let image in images) {
                let imageUrlSplit = images[image].split("/")
                let filename = imageUrlSplit[imageUrlSplit.length - 1]
                let deleted = await this.uploadService.deleteFromS3(filename)
                console.log(deleted)
            }
        }

        return await this.pageService.deletePage(pageDetails.pageId)
    }
}
