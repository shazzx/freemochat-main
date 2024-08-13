import { BadRequestException, Body, Controller, Get, InternalServerErrorException, Post, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from './user.service';
import { Response } from 'express';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'
import { UploadService } from 'src/upload/upload.service';
import { Public } from 'src/auth/public.decorator';
import { CreateUser, CreateUserDTO, FriendGeneral, FriendGeneralDTO, GetFriends, GetFriendsDTO, GetUser, GetUserDTO, LoginUser, LoginUserDTO, UpdateUser, UpdateUserDTO, VerifyOTP, VerifyOTPDTO } from 'src/schema/validation/user';
import { Request } from 'types/global';
import { Cursor, CursorDTO } from 'src/schema/validation/global';
import { OtpService } from 'src/otp/otp.service';
import { CryptoService } from 'src/crypto/crypto.service';

@Controller('user')
export class UserController {

    constructor(
        private authService: AuthService,
        private userService: UserService,
        private readonly uploadService: UploadService,
        private readonly otpService: OtpService,
        private readonly cryptoService: CryptoService
    ) { }

    @Public()
    @Post("create")
    async createUser(
        @Body(new ZodValidationPipe(CreateUser)) createUserDTO: CreateUserDTO,
        @Req() req: Request,
        @Res() res: Response) {

        try {
            const { firstname, lastname, username, email, password, confirmPassword, address, phone } = createUserDTO

            const secret = await this.cryptoService.generateSecret()
            const encryptedSecret = this.cryptoService.encrypt(secret)
            const tempSecret = uuidv4()

            let user = await this.userService.createUser({ firstname, lastname, username, email, password, confirmPassword, address, phone, secret: encryptedSecret, tempSecret })

            console.log("user created")

            const emailOTP = await this.otpService.generateOtp(encryptedSecret)
            const phoneOTP = await this.otpService.generateOtp(encryptedSecret)

            this.otpService.verifyOtp(encryptedSecret, emailOTP)

            console.log("emailOTP: ", emailOTP, "phoneOTP: ", phoneOTP)

            await this.otpService.sendOTPEmail("thanosgaming121@gmail.com", emailOTP)

            await this.otpService.sendOTPPhone("923122734021", phoneOTP)


            res.json({ success: true, tempSecret, username: user.username, message: "account created successfully", verification: "pending" })

        } catch (error) {
            console.log(error)
            throw new InternalServerErrorException(error)
        }
        // const payload = await this.authService.login(user)

        // response.cookie("refreshToken", payload.refresh_token, {
        //     httpOnly: true,
        //     sameSite: 'strict',
        //     maxAge: 60 * 60
        // }).json({
        //     access_token: payload.access_token, user
        // })
    }


    @Public()
    @Post('verify-otp')
    async veriyfOTP(
        @Body(new ZodValidationPipe(VerifyOTP)) verifyOTP: VerifyOTPDTO,
        @Req() req: Request,
        @Res({ passthrough: true }) response: Response) {
        const { username, tempSecret, otp } = verifyOTP
        try {
            const user = await this.userService.findUser(username)
            if (!user) {
                throw new BadRequestException()
            }

            if (!user.tempSecret || user.tempSecret !== tempSecret) {
                console.log('bad request')
                throw new BadRequestException()
            }

            const userSecret = user.secret
            let isValid = this.otpService.verifyOtp(otp, userSecret)

            if (!isValid) {
                throw new BadRequestException()
            }

            await this.userService.updateUser(user._id, { tempSecret: null })

            const payload = await this.authService.login(user)
            console.log('payload ', payload)

            response.cookie("refreshToken", payload.refresh_token, {
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            }).json({
                access_token: payload.access_token
            })
        } catch (error) {
            throw new Error(error)
        }
    }


    @Public()
    @Post('login')
    async loginUser(
        @Body(new ZodValidationPipe(LoginUser)) loginUserDTO: LoginUserDTO,
        @Req() req: Request,
        @Res({ passthrough: true }) response: Response) {
        const { username, password } = loginUserDTO
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
    async refreshToken(
        @Req() req: Request,
        @Res() res: Response) {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) {
            return new BadRequestException("something went wrong")
        }

        console.log(refreshToken, 'refresh')
        const accessToken = await this.authService.refreshToken(refreshToken)
        res.json({ accessToken })
    }

    @Get("")
    async getUser(
        @Query(new ZodValidationPipe(GetUser)) getUserDTO: GetUserDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const userPayload = req.user
        const query = getUserDTO

        const username = query.username || userPayload.username
        const user = await this.userService.getUser(username, null, userPayload.sub)

        res.json(user[0])
    }

    @Post("request")
    async friendRequest(
        @Body(new ZodValidationPipe(FriendGeneral)) friendGeneralDTO: FriendGeneralDTO,
        @Req() req: Request,
        @Res() response: Response) {
        const { sub } = req.user
        const { recepientId } = friendGeneralDTO
        response.json({ user: await this.userService.toggleRequest(sub, recepientId) })
    }

    @Post("friend/remove")
    async removeFriend(
        @Body(new ZodValidationPipe(FriendGeneral)) friendGeneralDTO: FriendGeneralDTO,
        @Req() req: Request,
        @Res() response: Response) {
        const { sub } = req.user
        const { recepientId } = friendGeneralDTO
        response.json(await this.userService.removeFriend(sub, recepientId))
    }

    @Post("request/accept")
    async acceptRequest(
        @Body(new ZodValidationPipe(FriendGeneral)) friendGeneralDTO: FriendGeneralDTO,
        @Req() req: Request,
        @Res() response: Response) {
        const { sub } = req.user
        const { recepientId } = friendGeneralDTO
        response.json(await this.userService.acceptFriendRequest(sub, recepientId))
    }

    @Post("request/reject")
    async rejectRequest(
        @Body(new ZodValidationPipe(FriendGeneral)) friendGeneralDTO: FriendGeneralDTO,
        @Req() req: Request,
        @Res() response: Response) {
        const { sub } = req.user
        const { recepientId } = friendGeneralDTO
        response.json(await this.userService.rejectFriendRequest(sub, recepientId))
    }

    @Post("follow")
    async toggleFollow(
        @Body(new ZodValidationPipe(FriendGeneral)) friendGeneralDTO: FriendGeneralDTO,
        @Req() req: Request,
        @Res() response: Response) {
        const { sub } = req.user
        const { recepientId } = friendGeneralDTO
        response.json(await this.userService.toggleFollow(sub, recepientId))
    }

    @Get("friends")
    async getFriends(
        @Query(new ZodValidationPipe(GetFriends)) getFriendsDTO: GetFriendsDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { userId, groupId, cursor } = getFriendsDTO
        const { sub } = req.user
        res.json(await this.userService.getFriends(cursor, userId ? userId : sub, groupId))
    }

    @Get("requests")
    async getFriendRequests(
        @Query(new ZodValidationPipe(Cursor)) cursorDTO: CursorDTO,
        @Req() req: Request,
        @Res() response: Response) {

        const { cursor } = cursorDTO
        const { sub } = req.user
        response.json(await this.userService.getFriendRequests(cursor, sub))
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post("update")
    async updateUser(
        @Body(new ZodValidationPipe(UpdateUser, true, "userData")) updateUserDTO: UpdateUserDTO,
        @Req() req: Request,
        @Res() res: Response,
        @UploadedFile() file: Express.Multer.File,) {

        const { images } = updateUserDTO
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

        console.log(updateUserDTO)
        let user = await this.userService.updateUser(sub, { ...updateUserDTO, images: _images })
        res.json(user)
    }

    @Post("delete")
    async deleteUser(@Req() req) {
        return await this.userService.deleteUser(req.user.sub)
    }
}
