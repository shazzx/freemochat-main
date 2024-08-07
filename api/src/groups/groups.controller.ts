import { BadRequestException, Body, Controller, Get, Post, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'

@Controller('groups')
export class GroupsController {
    constructor(private groupsService: GroupsService, private uploadService: UploadService) { }

    // @UseGuards(JwtAuthGuard)
    @Get()
    async getGroup(@Req() req: Request, @Res() res: Response) {
        const { handle } = req.query
        const { sub } = req.user as { sub: string }
        const group = await this.groupsService.getGroup(handle, sub)
        res.json(group)
    }


    // @UseGuards(JwtAuthGuard)
    @Get('all')
    async getGroups(@Req() req: Request, @Res() res: Response) {
        const { sub } = req.user as { sub: string }
        const groups = await this.groupsService.getGroups(sub)
        console.log(groups, 'controller lever')
        res.json(groups)
    }


    // @UseGuards(JwtAuthGuard)
    @Post("join")
    async toggleJoin(@Req() req) {
        const { groupDetails } = req.body
        const { username, sub } = req.user
        return await this.groupsService.toggleJoin(sub, groupDetails)
    }


    @Post("leave")
    async leaveGroup(@Req() req) {
        const { groupDetails } = req.body
        const { username, sub } = req.user
        // return await this.groupsService.leaveMember(sub, groupDetails)
    }

    @UseInterceptors(FilesInterceptor('files'))
    @Post("create")
    async createGroup(@Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[],
        @Body("groupData") groupData: string,
        resposne: Response) {
        console.log("files :", files, groupData)
        let { groupDetails } = JSON.parse(groupData)

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

        // await this.uploadService.storeMedia({ username, userId: sub, type: "group" }, media)
        res.json(await this.groupsService.createGroup(sub, { ...groupDetails, images }))
    }


    // @UseGuards(JwtAuthGuard)
    @Get("handleExists")
    async handleExists(@Req() req: Request, @Res() res: Response) {
        const { handle } = req.query as { handle: string }
        res.json(await this.groupsService.handleExists(handle))
    }


    // @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('files'))
    @Post("update")
    async updateGroup(@Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[],
        @Body("groupData") groupData: string,
        resposne: Response) {
        let { groupDetails, groupId, images } = JSON.parse(groupData)
        console.log(groupDetails, groupId, images, 'data')

        let _images;
        for (let file of files) {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            let uploaded = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
            if (file.originalname == 'profile' && typeof uploaded == 'string') {
                _images = { ..._images, profile: uploaded }
            }
            if (file.originalname == 'cover' && typeof uploaded == 'string') {
                _images = { ..._images, cover: uploaded }
            }

            if (typeof uploaded !== 'string') {
                throw new BadRequestException()
            }
        }

        res.json(await this.groupsService.updateGroup(groupId, { ...groupDetails, images: { ...images, ..._images }, }))
    }


    // @UseGuards(JwtAuthGuard)
    @Post("delete")
    async deleteGroup(@Req() req) {
        const { groupDetails } = req.body
        console.log(groupDetails)

        if (groupDetails.images) {
            const { images } = groupDetails
            console.log(images)
            for (let image in images) {
                if (typeof images[image] == "string") {

                    let imageUrlSplit = images[image].split("/")
                    let filename = imageUrlSplit[imageUrlSplit.length - 1]
                    let deleted = await this.uploadService.deleteFromS3(filename)
                    console.log(deleted)
                } else {
                    throw new BadRequestException()
                }
            }
        }

        return await this.groupsService.deleteGroup(groupDetails.groupId)
    }
}
