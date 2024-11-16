import { BadRequestException, Body, Controller, Get, Post, Query, Req, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { PageService } from './pages.service';
import {  Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'
import { UploadService } from 'src/upload/upload.service';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { CreatePage, CreatePageDTO, DeletePage, DeletePageDTO, PageExists, PageExistsDTO, PageFollow, PageFollowDTO, UpdatePage, UpdatePageDTO } from 'src/schema/validation/page';
import { Handle, HandleDTO } from 'src/schema/validation/global';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'types/global';


@Controller('page')
export class PageController {
    constructor(
        private readonly pageService: PageService, 
        private readonly uploadService: UploadService,
        private readonly eventEmiiter: EventEmitter2,
    ) {}

    @Get()
    async getPage(@Query(new ZodValidationPipe(Handle)) handleDTO: HandleDTO, @Req() req: Request, @Res() res: Response) {
        const { handle } = handleDTO
        const { sub } = req.user
        const page = await this.pageService.getPage(handle, sub)
        res.json(page)
    }

    @Post("follow")
    async followPage(@Body(new ZodValidationPipe(PageFollow)) body: PageFollowDTO, @Req() req: Request, @Res() res: Response) {
        const { pageDetails} = body
        const { sub } = req.user
        res.json(await this.pageService.toggleFollow(sub, pageDetails))
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
        console.log(pageDetails)

        const uploadPromise = files.map((file) => {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            const originalname = file.originalname
            return this.uploadService.processAndUploadContent(file.buffer, filename, fileType, originalname)
            
        })

        const { username, sub } = req.user

        let page = await this.pageService.createPage(
            { username, sub }, 
            { ...pageDetails, isUploaded: files.length > 0 ? false : null }
        )

        if(page){
            this.eventEmiiter.emit("profiles.upload", { uploadPromise, targetId: page._id.toString(), images: {}, type: 'page' })
        }

        res.json(page)
    }

    @UseInterceptors(FilesInterceptor('files'))
    @Post("update")
    async updatePage(@Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[],
    @Body(new ZodValidationPipe(UpdatePage, true, "pageData")) body: UpdatePageDTO) {
        let { pageDetails, pageId } = body

        let page = await this.pageService.getRawPage(pageId)

        if(!page || page.isUploaded == false){
            throw new BadRequestException()
        }

        const uploadPromise = files.map((file) => {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            const originalname = file.originalname
            return this.uploadService.processAndUploadContent(file.buffer, filename, fileType, originalname)
        })
        let updatePage = await this.pageService.updatePage(pageId, { ...pageDetails, isUploaded: files.length > 0 ? false : null })

        this.eventEmiiter.emit("profiles.upload", { uploadPromise, targetId: page._id.toString(), type: "page"})

        res.json(updatePage)
    }

    @Get("handleExists")
    async handleExists(@Query(new ZodValidationPipe(PageExists)) query: PageExistsDTO, @Req() req: Request, @Res() res: Response) {
        const { handle } = query
        res.json(await this.pageService.handleExists(handle))
    }

    @Post("delete")
    async deletePage(@Body(new ZodValidationPipe(DeletePage)) body: DeletePageDTO, @Req() req: Request, @Res() res: Response) {
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

        res.json(await this.pageService.deletePage(pageDetails.pageId))
    }
}
