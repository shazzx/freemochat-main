import { BadRequestException, Body, Controller, Get, Post, Req, Res, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from './user.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { CreateUserSchema } from 'src/dto/user/create-user.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'
import { UploadService } from 'src/upload/upload.service';
import { Public } from 'src/auth/public.decorator';

@Controller('user')
export class UserController {

    constructor(private authService: AuthService, private userService: UserService, private readonly uploadService: UploadService) { }
    @Public()
    @Post("create")
    // async createUser(@Body(new ZodValidationPipe(CreateUserSchema)) @Req() req, @Res() response: Response) {

    async createUser(@Req() req, @Res() response: Response) {
        const { firstname, lastname, username, email, password, confirmPassword, address, phone } = req.body
        console.log(req.body)
        let user = await this.userService.createUser({ firstname, lastname, username, email, password, confirmPassword, address, phone })

        const payload = await this.authService.login(user)

        response.cookie("refreshToken", payload.refresh_token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60
        }).json({
            access_token: payload.access_token, user
        })
    }

    @Public()
    @Post('login')
    async loginUser(@Req() req: Request, @Res({ passthrough: true }) response: Response) {
        const { username, password } = req.body
        console.log(username, password)
        const user = await this.authService.validateUser(username, password)
        console.log('validate user', user)
        const payload = await this.authService.login(user)
        console.log('payload ', payload)

        response.cookie("refreshToken", payload.refresh_token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        }).json({
            access_token: payload.access_token
        })
    }

    @Public()
    @Post("refresh-token")
    async refreshToken(@Req() req: Request, @Res() response: Response) {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) {
            return new BadRequestException("something went wrong")
        }

        console.log(refreshToken, 'refresh')
        const accessToken = await this.authService.refreshToken(refreshToken)
        return response.json({ accessToken })
    }

    @Get("")
    async getUser(@Req() req: Request, @Res() response: Response) {
        const userPayload = req.user as { username: string, sub: string }
        console.log('getuserpaylod', userPayload)
        const query = req.query as { username: string }
        const username = query.username || userPayload.username
        const user = await this.userService.getUser(username, null, userPayload.sub)
        console.log(user)
        response.json(user[0])
    }

    @Post("request")
    async friendRequest(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user as { username: string, sub: string }
        const { recepientId } = req.body
        response.json({ user: await this.userService.toggleRequest(sub, recepientId) })
    }

    @Post("friend/remove")
    async removeFriend(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user as { username: string, sub: string }
        const { recepientId } = req.body
        response.json(await this.userService.removeFriend(sub, recepientId))
    }

    @Post("request/accept")
    async acceptRequest(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user as { username: string, sub: string }
        const { recepientId } = req.body
        response.json(await this.userService.acceptFriendRequest(sub, recepientId))
    }

    @Post("request/reject")
    async rejectRequest(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user as { username: string, sub: string }
        const { recepientId } = req.body
        response.json(await this.userService.rejectFriendRequest(sub, recepientId))
    }

    @Post("follow")
    async toggleFollow(@Req() req: Request, @Res() response: Response) {
        const { sub } = req.user as { username: string, sub: string }
        const { recepientId } = req.body
        response.json(await this.userService.toggleFollow(sub, recepientId))
    }

    @Get("friends")
    async getFriends(@Req() req: Request, @Res() response: Response) {
        const { userId, groupId, cursor } = req.query
        const { sub } = req.user as { username: string, sub: string }
        response.json(await this.userService.getFriends(cursor, userId ? userId : sub, groupId))
    }

    @Get("requests")
    async getFriendRequests(@Req() req: Request, @Res() response: Response) {
        const { cursor } = req.query
        const { sub } = req.user as { username: string, sub: string }
        response.json(await this.userService.getFriendRequests(cursor, sub))
    }

    @Get("followers")
    async getFollowers(@Req() req: Request, @Res() response: Response) {
    }



    @UseInterceptors(FileInterceptor('file'))
    // @UseGuards(JwtAuthGuard)
    @Post("update")
    async updateUser(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File,
        @Body("userData") userData: string,
        resposne: Response) {
        const _userData = JSON.parse(userData)
        const { images } = _userData as { images: { profile: string, cover: string } }
        const { sub } = req.user as { sub: string, username: string }

        let _images = {}
        let uploaded;
        if (file) {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()

            uploaded = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)

            if (file.originalname == 'profile') {
                _images = { ...images, profile: uploaded }
            }
            if (file.originalname == 'cover') {
                _images = { ...images, cover: uploaded }
            }
        }

        console.log(_userData)
        let user = await this.userService.updateUser(sub, { ..._userData, images: _images })
        res.json(user)
    }

    // @UseGuards(JwtAuthGuard)
    @Get("users")
    async getUsers(@Req() req: Request, @Res() response: Response) {
        response.json({
            user: "user data"
        })
    }

    // @UseGuards(JwtAuthGuard)
    @Post("delete")
    async deleteUser(@Req() req) {
        return await this.userService.deleteUser(req.user.id)
    }
}
