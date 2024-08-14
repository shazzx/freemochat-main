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
import { CreateUser, CreateUserDTO, FriendGeneral, FriendGeneralDTO, GetFriends, GetFriendsDTO, GetUser, GetUserDTO, LoginUser, LoginUserDTO, resendOTP, resendOTPDTO, UpdateUser, UpdateUserDTO, VerifyOTP, VerifyOTPDTO } from 'src/schema/validation/user';
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

            const emailSecret = this.otpService.generateSecret()
            const phoneSecret = this.otpService.generateSecret()
            const tempSecret = uuidv4()

            let user = await this.userService.createUser({ firstname, lastname, username, email, password, confirmPassword, address, phone, emailSecret: emailSecret.base32, phoneSecret: phoneSecret.base32, tempSecret })

            console.log("user created")
            const phoneOTP = this.otpService.generateOtp(phoneSecret)
            const emailOTP = this.otpService.generateOtp(emailSecret)

            console.log('phoneOTP: ', phoneOTP, "emailOTP: ", emailOTP, "tempSecret: ", tempSecret, "phone secret: ", phoneSecret, "email secret: ", emailSecret,)

            // await this.otpService.sendOTPEmail("thanosgaming121@gmail.com", phoneOTP)
            // await this.otpService.sendOTPPhone("923122734021", phoneOTP)

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
        @Res({ passthrough: true }) res: Response) {
        const { username, authId, otp, type } = verifyOTP
        try {
            const user = await this.userService.findUser(username)
            if (!user) {
                throw new BadRequestException()
            }

            if (!user.tempSecret || user.tempSecret !== authId) {
                console.log('bad request')
                throw new BadRequestException()
            }

            const phoneSecret = user.phoneSecret
            const emailSecret = user.emailSecret
            console.log(phoneSecret, ' phone secret', "email secret ", emailSecret)

            let isValidPhoneSecret = this.otpService.verifyOtp(otp, phoneSecret)
            let isValidEmailSecret = this.otpService.verifyOtp(otp, emailSecret)
            console.log(isValidEmailSecret, isValidPhoneSecret)

            if (!isValidEmailSecret && !isValidPhoneSecret) {
                throw new BadRequestException("OTP is not valid")
            }

            if(type == 'email' && isValidEmailSecret && user.isPhoneVerified){

                await this.userService.updateUser(user._id, { tempSecret: null, isEmailVerified: true })
                return res.json({success: true, email: true, phone: true})
            }

            if(type == 'phone' && isValidPhoneSecret && user.isEmailVerified){
                await this.userService.updateUser(user._id, { tempSecret: null, isPhoneVerified: true })
                return res.json({success: true, email: true, phone: true})
            }

            if(type == 'email' && isValidEmailSecret){
                await this.userService.updateUser(user._id, { isEmailVerified: true })
                return res.json({success: true, email: true})
            }

            if(type == 'phone' && isValidPhoneSecret){
                await this.userService.updateUser(user._id, { isPhoneVerified: true })
                return res.json({success: true, phone: true})
            }

            throw new BadRequestException()

        } catch (error) {
            res.status(400).json({success: false, error: {message: error.message}})
        }
    }


    @Public()
    @Post('resend-otp')
    async resendOTP(
        @Body(new ZodValidationPipe(resendOTP)) resendOTPDTO: resendOTPDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { username, authId, type } = resendOTPDTO
        try {
            const user = await this.userService.findUser(username)
            if (!user) {
                throw new BadRequestException()
            }

            if (!user.tempSecret || user.tempSecret !== authId) {
                console.log('bad request')
                throw new BadRequestException()
            }

            const phoneSecret = user.phoneSecret
            const emailSecret = user.emailSecret
            console.log(phoneSecret, ' phone secret', "email secret ", emailSecret)

            if(type == 'email'){
                // let secret = this.otpService.generateSecret()
                let emailOTP = this.otpService.generateOtp(emailSecret)
                console.log(emailOTP, 'email')
                return res.json({success: true, message: "otp has been sent to your email"})
            }


            if(type == 'phone'){
                let phoneOTP = this.otpService.generateOtp(phoneSecret)
                console.log(phoneOTP, 'phone')
                return res.json({success: true, message: "otp has been sent to your phone"})
            }

            throw new BadRequestException()
        }catch(err){
            res.status(err.statusCode || 500).json({success: false, message: err.message})
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
        const user = await this.userService.findUser(username)

        res.json(user)
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

        // const { images } = updateUserDTO
        const { sub } = req.user as { sub: string, username: string }

        let images = {}
        console.log(file)
        if (file) {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()

            let {url} = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)

            if (file.originalname == 'profile') {
                images = { profile: url }
            }
            if (file.originalname == 'cover') {
                images = { cover: url }
            }
        }

        console.log(updateUserDTO, images)

        let user = await this.userService.updateUser(sub, { ...updateUserDTO, ...images })
        res.json({user})
    }

    @Post("delete")
    async deleteUser(@Req() req) {
        return await this.userService.deleteUser(req.user.sub)
    }
}
