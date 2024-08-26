import { BadRequestException, Body, Controller, Get, Post, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { CGroupsService } from './cgroups.service';
import {  Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'
import { UploadService } from 'src/upload/upload.service';
import { Request } from 'types/global';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { CreateChatGroup, CreateChatGroupDTO, GetChatGroup, GetChatGroupDTO, UpdateChatGroup, UpdateChatGroupDTO } from 'src/schema/validation/chatgroup';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('chatgroups')
export class CGroupsController {
    constructor(
        private chatGroupService: CGroupsService, 
        private uploadService: UploadService,
        private readonly eventEmiiter: EventEmitter2,

    ) { }

    @Get()
    async getGroups(@Req() req: Request, @Res() res: Response) {
        const { sub } = req.user
        res.json(await this.chatGroupService.getGroups(sub))
    }

    @Get('group')
    async getGroup(@Query(new ZodValidationPipe(GetChatGroup)) query: GetChatGroupDTO, @Req() req: Request, @Res() res: Response) {
        const {sub} = req.user
        const {id} = query
        res.json(await this.chatGroupService.getGroup(sub, id))
    }

    @UseInterceptors(FilesInterceptor('files'))
    @Post("create")
    async createGroup(@Body(new ZodValidationPipe(CreateChatGroup, true, "groupData")) body: CreateChatGroupDTO, @Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[],
        resposne: Response) {
        console.log("files :", files, body)
        let { groupDetails } = body

        const uploadPromise = files.map((file) => {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            const originalname = file.originalname
            return this.uploadService.processAndUploadContent(file.buffer, filename, fileType, originalname)
            
        })
        const { sub } = req.user 


        let group = files.length > 0 ? await this.chatGroupService.createGroup(sub, { ...groupDetails, isUploaded: false})
        : await this.chatGroupService.createGroup(sub, { ...groupDetails})

        this.eventEmiiter.emit("profiles.upload", { uploadPromise, targetId: group._id.toString(), type: 'chatgroup' })

        res.json(group)
        // let images;
        // for (let file of files) {
        //     const fileType = getFileType(file.mimetype)
        //     const filename = uuidv4()
        //     console.log(file)
        //     let {url} = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)
        //     console.log({url})
        //     if (file.originalname == 'profile') {
        //         images = { ...images, profile: url }
        //     }
        //     if (file.originalname == 'cover') {
        //         images = { ...images, cover: url }
        //     }
        // }

        // console.log(images)
    }

    @UseInterceptors(FilesInterceptor('files'))
    @Post("update")
    async updateGroup(@Body(new ZodValidationPipe(UpdateChatGroup, true, "groupData")) body: UpdateChatGroupDTO, @Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[],
        resposne: Response) {
        let { groupDetails, groupId, images } = body
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

    // @Post("join")
    // async joinChatGroup(@Body(new ZodValidationPipe(JoinGroup)) body: JoinGroupDTO, @Req() req) {
    //     const { groupDetails } = req.body
    //     const { username, sub } = req.user
    //     return await this.chatGroupService.joinChatGroup({ username, userId: sub }, groupDetails)
    // }

    // @Post("leave")
    // async leaveChatGroup(@Req() req) {
    //     const { groupDetails } = req.body
    //     const { username, sub } = req.user
    //     return await this.chatGroupService.leaveChatGroup({ username, userId: sub }, groupDetails)
    // }

    @Post("delete")
    async deleteGroup(@Req() req) {
        const { groupId } = req.body
        return await this.chatGroupService.deleteGroup(groupId)
    }
}
