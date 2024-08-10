import { Body, Controller, Get, Post, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PageService } from './pages.service';
import { query, Request, Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'
import { UploadService } from 'src/upload/upload.service';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { CreatePage, CreatePageDTO, DeletePage, DeletePageDTO, PageExists, PageExistsDTO, PageFollow, PageFollowDTO, UpdatePage, UpdatePageDTO } from 'src/schema/validation/page';
import { Handle, HandleDTO } from 'src/schema/validation/global';


@Controller('page')
export class PageController {
    constructor(private pageService: PageService, private readonly uploadService: UploadService) {

    }

    @Get()
    async getPage(@Query(new ZodValidationPipe(Handle)) handleDTO: HandleDTO, @Req() req, @Res() res: Response) {
        const { handle } = handleDTO
        const { sub } = req.user

        const page = await this.pageService.getPage(handle, sub)
        res.json(page)
    }

    @Post("follow")
    async followPage(@Body(new ZodValidationPipe(PageFollow)) body: PageFollowDTO, @Req() req, @Res() res: Response) {
        const { pageDetails} = body
        const { username, sub } = req.user
        return await this.pageService.toggleFollow(sub, pageDetails)
    }

    @Get("all")
    async getPages(@Req() req) {
        const {sub} = req.user
        return await this.pageService.getPages(sub)
    }

    @UseInterceptors(FilesInterceptor('files'))
    @Post("create")
    async createPage(@Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[],
    @Body(new ZodValidationPipe(CreatePage, true, "pageData")) body: CreatePageDTO) {
        console.log("files :", files, body)
        let { pageDetails } = body

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

    @UseInterceptors(FilesInterceptor('files'))
    @Post("update")
    async updatePage(@Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[],
    @Body(new ZodValidationPipe(UpdatePage, true, "pageData")) body: UpdatePageDTO) {
        let { pageDetails, pageId, images } = body

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

    @Get("handleExists")
    async handleExists(@Query(new ZodValidationPipe(PageExists)) query: PageExistsDTO, @Req() req: Request, @Res() res: Response) {
        const { handle } = query
        res.json(await this.pageService.handleExists(handle))
    }

    @Post("delete")
    async deletePage(@Body(new ZodValidationPipe(DeletePage)) body: DeletePageDTO, @Req() req) {
        const { pageDetails } = body

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
