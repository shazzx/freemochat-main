import { BadRequestException, Body, Controller, Get, Post, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { CGroupsService } from './cgroups.service';
import { Request, Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'
import { UploadService } from 'src/upload/upload.service';

@Controller('chatgroups')
export class CGroupsController {
    constructor(private chatGroupService: CGroupsService, private uploadService: UploadService) { }

    @Get()
    async getGroups(@Req() req, @Res() res: Response) {
        const { username, sub } = req.user
        res.json(await this.chatGroupService.getGroups(sub))
    }

    @Get('group')
    async getGroup(@Req() req, @Res() res: Response) {
        const {sub} = req.user as {sub : string}
        res.json(await this.chatGroupService.getGroup(sub, req.query.id))
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
        res.json(await this.chatGroupService.createGroup(sub, { ...groupDetails, images }))
    }
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

        res.json(await this.chatGroupService.updateGroup(groupId, { ...groupDetails, images: { ...images, ..._images }, }))
    }

    // @UseGuards(JwtAuthGuard)
    @Post("join")
    async joinChatGroup(@Req() req) {
        const { groupDetails } = req.body
        const { username, sub } = req.user
        return await this.chatGroupService.joinChatGroup({ username, userId: sub }, groupDetails)
    }


    // @UseGuards(JwtAuthGuard)
    @Post("leave")
    async leaveChatGroup(@Req() req) {
        const { groupDetails } = req.body
        const { username, sub } = req.user
        return await this.chatGroupService.leaveChatGroup({ username, userId: sub }, groupDetails)
    }


    // @Post("update")
    // async updateGroup(@Req() req) {
    //     const { userDetails, groupDetails } = req.body
    //     return await this.chatGroupService.updateGroup(userDetails.username, groupDetails)
    // }


    // @UseGuards(JwtAuthGuard)
    @Post("delete")
    async deleteGroup(@Req() req) {
        const { groupId } = req.body
        return await this.chatGroupService.deleteGroup(groupId)
    }
}
