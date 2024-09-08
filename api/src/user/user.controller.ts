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
import { ChangePassword, ChangePasswordDTO, CreateUser, CreateUserDTO, ForgetPassword, ForgetPasswordDTO, ForgetPasswordRequestDTO, FriendGeneral, FriendGeneralDTO, GetFriends, GetFriendsDTO, GetUser, GetUserDTO, LoginUser, LoginUserDTO, resendOTP, resendOTPDTO, resendOTPUser, resendOTPUserDTO, UpdateUser, UpdateUserDTO, usernameExists, usernameExistsDTO, verificationStatus, verificationStatusDTO, VerifyOTP, VerifyOTPDTO, VerifyOTPUser, VerifyOTPUserDTO } from 'src/schema/validation/user';
import { Request } from 'types/global';
import { Cursor, CursorDTO } from 'src/schema/validation/global';
import { OtpService } from 'src/otp/otp.service';
import { LocationService } from 'src/location/location.service';
import { USER } from 'src/utils/enums/user.c';
import { TwilioService } from 'src/twilio/twilio.service';
import { compare } from 'bcrypt';
import { CryptoService } from 'src/crypto/crypto.service';
import { CacheService } from 'src/cache/cache.service';

@Controller('user')
export class UserController {

    constructor(
        private authService: AuthService,
        private userService: UserService,
        private readonly uploadService: UploadService,
        private readonly otpService: OtpService,
        private readonly locationService: LocationService,
        private readonly twilioService: TwilioService,
        private readonly cryptoService: CryptoService,
        private readonly cacheService: CacheService,
    ) { }


    @Public()
    @Post("create")
    async createUser(
        @Body(new ZodValidationPipe(CreateUser)) createUserDTO: CreateUserDTO,
        @Req() req: Request,
        @Res() res: Response) {

        try {
            const { firstname, lastname, username, email, password, confirmPassword, address, phone } = createUserDTO

            await this.locationService.isValidAddress({ country: address.country, city: address.city })

            const tempSecret = uuidv4()

            let user = await this.userService.createUser({ firstname, lastname, username, email, password, confirmPassword, address, phone, tempSecret })

            await this.locationService.checkAddressRegisteration(address)

            console.log("user created")
            const phoneOTP = await this.otpService.generateOtp(user._id, 'phone')
            const emailOTP = await this.otpService.generateOtp(user._id, 'email')

            console.log('phoneOTP: ', phoneOTP, "emailOTP: ", emailOTP, "tempSecret: ", tempSecret, "phone secret: ")

            await this.twilioService.sendEmail({
                to: email,
                from: 'freedombook99@gmail.com',
                subject: "OTP Verification",
                text: `Your email otp code is: ${emailOTP} `,
                // html: emailData.html,
            })

            await this.twilioService.sendSMS(phone, `Your phone otp code is: ${phoneOTP}`)
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
        @Res() res: Response) {
        const { username, authId, otp, type } = verifyOTP
        try {
            const user = await this.userService.findUser(username)
            console.log(user, authId)
            if (!user) {
                throw new BadRequestException()
            }

            if (!user.tempSecret || user.tempSecret !== authId) {
                console.log('bad request')
                throw new BadRequestException()
            }


            let isValidPhoneSecret = await this.otpService.verifyOtp(user._id, otp, 'phone')
            let isValidEmailSecret = await this.otpService.verifyOtp(user._id, otp, 'email')

            if (!isValidEmailSecret && !isValidPhoneSecret) {
                throw new BadRequestException("OTP is not valid")
            }

            if (type == 'email' && isValidEmailSecret && user.isPhoneVerified) {
                console.log('type em')

                await this.userService.updateUser(user._id, { tempSecret: null, isEmailVerified: true, isActive: true })
                return res.json({ success: true, email: true, phone: true })
            }

            if (type == 'phone' && isValidPhoneSecret && user.isEmailVerified) {
                console.log('type phone')

                await this.userService.updateUser(user._id, { tempSecret: null, isPhoneVerified: true, isActive: true })
                return res.json({ success: true, email: true, phone: true })
            }

            if (type == 'email' && isValidEmailSecret) {
                console.log('just em')
                await this.userService.updateUser(user._id, { isEmailVerified: true })
                return res.json({ success: true, email: true })
            }

            if (type == 'phone' && isValidPhoneSecret) {
                console.log('just phone')

                await this.userService.updateUser(user._id, { isPhoneVerified: true })
                return res.json({ success: true, phone: true })
            }

            throw new BadRequestException()

        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } })
        }
    }

    @Post('verify-otp-user')
    async veriyfOTPUser(
        @Body(new ZodValidationPipe(VerifyOTPUser)) verifyOTP: VerifyOTPUserDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { username, updatedData, otp, type } = verifyOTP
        try {
            const user = await this.userService.findUser(username)
            if (!user) {
                throw new BadRequestException()
            }

            console.log("username, updatedData, otp, type", username, updatedData, otp, type)

            let isValidPhoneSecret = await this.otpService.verifyOtp(user._id, otp, 'phone')
            let isValidEmailSecret = await this.otpService.verifyOtp(user._id, otp, 'email')

            if (!isValidEmailSecret && !isValidPhoneSecret) {
                throw new BadRequestException("OTP is not valid")
            }


            if (type == 'email' && updatedData['changePassword']) {
                console.log('updatng emal', updatedData.changePassword)
                let isValidPassword = await compare(updatedData.changePassword.currentPassword, user.password)
                if (isValidPassword) {
                    let hashedPassword = await this.cryptoService.hash(updatedData.changePassword.password, 16)
                    await this.userService.updateUser(user._id, { password: hashedPassword })
                    res.json({ success: true })
                    return
                }
                throw new BadRequestException("invalid current password")
            }

            if (type == 'email' && updatedData['email']) {
                console.log('updatng emal', updatedData.email)

                await this.userService.updateUser(user._id, { email: updatedData.email })
                res.json({ success: true })
                return
            }

            if (type == 'phone' && updatedData['address']) {
                console.log('updatng address')

                await this.userService.updateUser(user._id, { address: updatedData.address })
                res.json({ success: true })
                return
            }

            if (type == 'phone' && updatedData['phone']) {
                console.log('updatng phone')
                await this.userService.updateUser(user._id, { phone: updatedData.phone })
                res.json({ success: true })
                return
            }


            throw new BadRequestException()

        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } })
        }
    }

    @Post('change-current-password')
    async changeUserPassword(
        @Body(new ZodValidationPipe(ChangePassword)) changePasswordDTO: ChangePasswordDTO,
        @Req() req: Request,
        @Res() res: Response) {

        const username = req.user.username
        const { changePassword } = changePasswordDTO
        try {
            const user = await this.userService.findUser(username)
            if (!user) {
                throw new BadRequestException()
            }

            let isValidPassword = await compare(changePassword.currentPassword, user.password)
            console.log(isValidPassword)
            if (isValidPassword) {
                let hashedPassword = await this.cryptoService.hash(changePassword.password, 16)
                await this.userService.updateUser(user._id, { password: hashedPassword })
                res.json({ success: true })
                return
            }
            throw new BadRequestException("invalid current password")

        } catch (error) {
            console.log(error)
            if (error.name == "MongoServerError" && error.code == 11000) {
                res.status(400).json({ success: false, error: { message: error.keyPattern['email'] ? "Email Already Taken" : "Phone Already Taken" } })
                return
            }
            res.status(400).json({ success: false, error: { message: error.message } })
        }
    }

    @Post('forget-password')
    async forgetPassword(
        @Body(new ZodValidationPipe(ForgetPassword)) changePasswordDTO: ForgetPasswordDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { otp, type, changePassword } = changePasswordDTO
        const username = req.user.username

        try {
            const user = await this.userService.findUser(username)
            if (!user) {
                throw new BadRequestException()
            }


            let isValidPhoneSecret = await this.otpService.verifyOtp(user._id, otp, 'phone')
            let isValidEmailSecret = await this.otpService.verifyOtp(user._id, otp, 'email')

            if (!isValidEmailSecret && !isValidPhoneSecret) {
                throw new BadRequestException("OTP is not valid")
            }

            if (type == 'email') {
                let hashedPassword = await this.cryptoService.hash(changePassword.password, 16)
                await this.userService.updateUser(user._id, { password: hashedPassword })
                res.json({ success: true })
                return
            }

            throw new BadRequestException("somthing went wrong")

        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } })
        }
    }

    @Public()
    @Post('forget-password-request')
    async forgetPasswordRequest(
        @Body(new ZodValidationPipe(ForgetPassword)) changePasswordDTO: ForgetPasswordRequestDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { username } = changePasswordDTO

        try {
            const user = await this.userService.findUser(username)

            if (!user) {
                throw new BadRequestException()
            }

            const authId = uuidv4()

            await this.cacheService.setForgetPassword(user.userId, authId)
            console.log(`http://localhost:5173/forget-password/${authId}?username=${user.username}`)
            return res.json({ success: true, message: "otp has been sent to your email" })

        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } })

        }
    }

    @Public()
    @Post('forget-password-open')
    async forgetPasswordPub(
        @Body(new ZodValidationPipe(ForgetPassword)) changePasswordDTO: ForgetPasswordDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { username, authId, otp, type, changePassword } = changePasswordDTO

        try {
            const user = await this.userService.findUser(username)
            if (!user) {
                throw new BadRequestException()
            }

            if (!otp || !type || !changePassword) {
                throw new BadRequestException()
            }

            let isValidPhoneSecret = await this.otpService.verifyOtp(user._id, otp, 'phone')
            let isValidEmailSecret = await this.otpService.verifyOtp(user._id, otp, 'email')

            if (!isValidEmailSecret && !isValidPhoneSecret) {
                throw new BadRequestException("OTP is not valid")
            }

            let _authId = await this.cacheService.getForgetPassword(user._id)

            if (authId !== _authId) {
                throw new BadRequestException("OTP is not valid")
            }


            if (type == 'email') {
                let hashedPassword = await this.cryptoService.hash(changePassword.password, 16)
                await this.userService.updateUser(user._id, { password: hashedPassword })
                res.json({ success: true })
                return
            }

            throw new BadRequestException("somthing went wrong")

        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } })
        }
    }

    @Post('username-exists')
    async userExists(
        @Body(new ZodValidationPipe(usernameExists)) usernameExists: usernameExistsDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { username } = usernameExists
         
        if (username == req.user.username) {
            return res.json({ success: true })
        }
        const user = await this.userService.findUser(username)
        if (!user) {
            return res.json({ success: true })
        }
        return res.json({ success: false })
    }


    @Public()
    @Post('verification-status')
    async checkVerificationStatus(
        @Body(new ZodValidationPipe(verificationStatus)) verificationStatusDTO: verificationStatusDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { username, authId } = verificationStatusDTO
        const user = await this.userService.findUser(username)
        if (!user) {
            throw new BadRequestException(USER.NOT_EXIST)
        }

        if (!user.tempSecret || user.tempSecret !== authId) {
            throw new BadRequestException(USER.ALREADY_VERIFIED)
        }

        const isPhoneVerified = user.isPhoneVerified
        const isEmailVerified = user.isEmailVerified

        return res.json({ isPhoneVerified, isEmailVerified })
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

            if (type == 'email') {
                // let secret = this.otpService.generateSecret()
                let emailOTP = await this.otpService.generateOtp(user._id, 'email')
                console.log(emailOTP, 'email')

                // await this.twilioService.sendEmail({
                //     to: user.email,
                //     from: 'freedombook99@gmail.com',
                //     subject: "OTP Verification",
                //     text: `Your email otp code is: ${emailOTP} `,
                //     // html: emailData.html,
                // })
                return res.json({ success: true, message: "otp has been sent to your email" })
            }


            if (type == 'phone') {
                let phoneOTP = await this.otpService.generateOtp(user._id, 'phone')
                console.log(phoneOTP, 'phone')
                console.log(user.phone)
                await this.twilioService.sendSMS(user.phone, `Your phone otp code is: ${phoneOTP}`)
                return res.json({ success: true, message: "otp has been sent to your phone" })
            }

            throw new BadRequestException()
        } catch (err) {
            res.status(err.statusCode || 500).json({ success: false, message: err.message })
        }
    }
    

    @Post('resend-otp-user')
    async resendOTPUser(
        @Body(new ZodValidationPipe(resendOTPUser)) resendOTPDTO: resendOTPUserDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { username, type, phone } = resendOTPDTO
        try {
            const user = await this.userService.findUser(username)
            if (!user) {
                throw new BadRequestException()
            }

            if (type == 'email') {
                let emailOTP = await this.otpService.generateOtp(user._id, 'email')

                await this.twilioService.sendEmail({
                    to: user.email,
                    from: 'freedombook99@gmail.com',
                    subject: "OTP Verification",
                    text: `Your email otp code is: ${emailOTP} `,
                    // html: emailData.html,
                })
                console.log(emailOTP, 'email')
                return res.json({ success: true, message: "otp has been sent to your email" })
            }


            if (type == 'phone') {
                let phoneOTP = await this.otpService.generateOtp(user._id, 'phone')
                console.log(phoneOTP, 'phone send to', (phone || user.phone))
                console.log(phone || user.phone)
                // await this.twilioService.sendSMS(user.phone, `Your phone otp code is: ${phoneOTP}`)

                return res.json({ success: true, message: "otp has been sent to your phone" })
            }

            throw new BadRequestException()
        } catch (err) {
            res.status(err.statusCode || 500).json({ success: false, message: err.message })
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


    @Post('logout')
    async logoutUser(
        @Req() req: Request,
        @Res({ passthrough: true }) response: Response) {
        response.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', })
        response.json({ success: true })
    }

    @Public()
    @Post("refresh-token")
    async refreshToken(
        @Req() req: Request,
        @Res() res: Response) {
        const refreshToken = req.cookies.refreshToken

        if (!refreshToken) {
            throw new BadRequestException("something went wrong")
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
        const user = await this.userService.getUser(username, null, req.user.sub)
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

        // const { images } = updateUserDTO
        const { sub } = req.user as { sub: string, username: string }

        let images = {}
        console.log(file)
        if (file) {
            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()

            let { url } = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)

            if (file.originalname == 'profile') {
                images = { profile: url }
            }
            if (file.originalname == 'cover') {
                images = { cover: url }
            }
        }

        console.log(updateUserDTO, images)

        let user = await this.userService.updateUser(sub, { ...updateUserDTO, ...images })
        res.json({ user })
    }

    @Post("delete")
    async deleteUser(@Req() req) {
        return await this.userService.deleteUser(req.user.sub)
    }
}
