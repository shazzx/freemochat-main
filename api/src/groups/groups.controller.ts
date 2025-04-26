import { BadRequestException, Body, Controller, Get, Post, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'express';

import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'
import { CreateGroup, CreateGroupDTO, DeleteGroup, DeleteGroupDTO, GroupExists, GroupExistsDTO, GroupJoin, GroupJoinDTO, UpdateGroup, UpdateGroupDTO } from 'src/schema/validation/group';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { Request } from 'types/global';
import { Handle, HandleDTO } from 'src/schema/validation/global';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('groups')
export class GroupsController {
    constructor(
        private groupsService: GroupsService, 
        private uploadService: UploadService,
        private readonly eventEmiiter: EventEmitter2,
    ) { }

    @Get()
    async getGroup(@Query(new ZodValidationPipe(Handle)) handleDTO: HandleDTO, @Req() req: Request, @Res() res: Response) {
        const { handle } = handleDTO
        const { sub } = req.user
        res.json(await this.groupsService.getGroup(handle, sub))
    }

    @Get('all')
    async getGroups(@Req() req: Request, @Res() res: Response) {
        const { sub } = req.user
        res.json(await this.groupsService.getGroups(sub))
    }

    @Post("join")
    async toggleJoin(@Body(new ZodValidationPipe(GroupJoin)) body: GroupJoinDTO, @Req() req: Request , @Res() res: Response) {
        const { groupDetails } = body
        const {sub} = req.user
        res.json(await this.groupsService.toggleJoin(sub, groupDetails))
    }


    @Get("handleExists")
    async handleExists(@Query(new ZodValidationPipe(GroupExists)) query: GroupExistsDTO, @Req() req: Request, @Res() res: Response) {
        const { handle } = query
        res.json(await this.groupsService.handleExists(handle))
    }


    @UseInterceptors(FilesInterceptor('files'))
    @Post("create")
    async createGroup(@Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[],
    @Body(new ZodValidationPipe(CreateGroup, true, "groupData")) body: CreateGroupDTO) {
        let { groupDetails } = body

        const uploadPromise = files.map((file) => {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            const originalname = file.originalname
            return this.uploadService.processAndUploadContent(file.buffer, filename, fileType, originalname)
            
        })

        const { sub } = req.user 
        
        let group = files.length > 0 ? await this.groupsService.createGroup(sub, { ...groupDetails, isUploaded: false})
        : await this.groupsService.createGroup(sub, { ...groupDetails})

        this.eventEmiiter.emit("profiles.upload", { uploadPromise, targetId: group._id.toString(), type: 'group' })

        res.json(group)
    }


    @UseInterceptors(FilesInterceptor('files'))
    @Post("update")
    async updateGroup(@Req() req: Request, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[],
        @Body(new ZodValidationPipe(UpdateGroup, true, "groupData")) body: UpdateGroupDTO,
        resposne: Response) {

        let { groupDetails, groupId } = body
        let group = await this.groupsService.getRawGroup(groupId)

        if(!group || group.isUploaded == false){
            throw new BadRequestException()
        }

        const uploadPromise = files.map((file) => {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()
            const originalname = file.originalname
            return this.uploadService.processAndUploadContent(file.buffer, filename, fileType, originalname)
        })

        this.eventEmiiter.emit("profiles.upload", { uploadPromise, targetId: group._id.toString(), type: "group" })
        res.json(await this.groupsService.updateGroup(groupId, { ...groupDetails, isUploaded: files.length > 0 ? false : null }))
    }

    @Post("delete")
    async deleteGroup(@Body(new ZodValidationPipe(DeleteGroup)) body: DeleteGroupDTO, @Req() req) {
        const { groupDetails } = body

        if (groupDetails.images) {
            const { images } = groupDetails

            for (let image in images) {
                if (typeof images[image] == "string") {

                    let imageUrlSplit = images[image].split("/")
                    let filename = imageUrlSplit[imageUrlSplit.length - 1]
                    let deleted = await this.uploadService.deleteFromS3(filename)
                } else {
                    throw new BadRequestException()
                }
            }
        }

        return await this.groupsService.deleteGroup(groupDetails.groupId)
    }
}
