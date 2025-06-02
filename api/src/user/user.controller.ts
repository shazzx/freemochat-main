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
import { areFriendsDTO, ChangePassword, ChangePasswordDTO, CreateUser, CreateUserDTO, ForgetPassword, ForgetPasswordDTO, ForgetPasswordPub, ForgetPasswordPubDTO, ForgetPasswordRequest, ForgetPasswordRequestDTO, FriendGeneral, FriendGeneralDTO, GetFriends, GetFriendsDTO, GetUser, GetUserDTO, LoginUser, LoginUserDTO, resendOTP, resendOTPDTO, resendOTPUser, resendOTPUserDTO, UpdateUser, UpdateUserDTO, usernameExists, usernameExistsDTO, verificationStatus, verificationStatusDTO, VerifyOTP, VerifyOTPDTO, VerifyOTPUser, VerifyOTPUserDTO } from 'src/schema/validation/user';
import { Request } from 'types/global';
import { Cursor, CursorDTO } from 'src/schema/validation/global';
import { OtpService } from 'src/otp/otp.service';
import { LocationService } from 'src/location/location.service';
import { USER } from 'src/utils/enums/user.c';
import { TwilioService } from 'src/twilio/twilio.service';
import { compare } from 'bcrypt';
import { CryptoService } from 'src/crypto/crypto.service';
import { CacheService } from 'src/cache/cache.service';
import { messageGenerator } from 'src/utils/messageGenerator';
import Expo from 'expo-server-sdk';

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
    @Post("create/v2")
    async createUser(
        @Body(new ZodValidationPipe(CreateUser)) createUserDTO: CreateUserDTO,
        @Req() req: Request,
        @Res() res: Response) {

        try {
            const { firstname, lastname, username, password, confirmPassword, address, phone, email } = createUserDTO

            const userExists = await this.userService.findUser(email)

            if (userExists) {
                throw new BadRequestException("Email is already taken")
            }

            await this.locationService.isValidAddress({ country: address.country, city: address.city })

            const tempSecret = uuidv4()

            let user = await this.userService.createUser({ firstname, lastname, username, password, confirmPassword, address, phone, tempSecret, email })

            await this.locationService.checkAddressRegisteration(address)

            console.log("user created")
            // const phoneOTP = await this.otpService.generateOtp(user._id, 'phone')
            const emailOTP = await this.otpService.generateOtp(user._id, 'email')
            const message = messageGenerator(user.firstname + " " + user?.lastname, emailOTP, 'register')

            console.log('emailOTP: ', emailOTP, "tempSecret: ", tempSecret, "phone secret: ")

            await this.twilioService.sendEmail({
                to: email,
                from: process.env.VERIFY_EMAIL,
                subject: "OTP Verification",
                html: `<div>${message}</div>`,
            })

            console.log(message)
            // await this.twilioService.sendSMS(phone, message)
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
    @Post('verify-otp/v2')
    async veriyfOTP(
        @Body(new ZodValidationPipe(VerifyOTP)) verifyOTP: VerifyOTPDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { username, authId, otp, type } = verifyOTP
        try {
            const user = await this.userService.findUser(username)
            if (!user) {
                console.log('no user')
                throw new BadRequestException()
            }

            if (!user.tempSecret || user.tempSecret !== authId) {
                console.log('bad request')
                throw new BadRequestException()
            }


            // let isValidPhoneSecret = await this.otpService.verifyOtp(user._id, otp, 'phone')
            let isValidEmailSecret = await this.otpService.verifyOtp(user._id, otp, 'email')

            // if (!isValidEmailSecret && !isValidPhoneSecret) {
            //     throw new BadRequestException("OTP is not valid")
            // }



            if (!isValidEmailSecret) {
                console.log('otp is not valid')
                throw new BadRequestException("OTP is not valid")
            }

            // if (type == 'email' && isValidEmailSecret && user.isPhoneVerified) {
            //     console.log('type em')

            //     await this.userService.updateUser(user._id, { tempSecret: null, isEmailVerified: true, isActive: true })
            //     return res.json({ success: true, email: true, phone: true })
            // }

            // if (type == 'phone' && isValidPhoneSecret) {
            //     console.log('type phone')

            //     await this.userService.updateUser(user._id, { tempSecret: null, isPhoneVerified: true, isActive: true })
            //     return res.json({ success: true, phone: true })
            // }

            if (type == 'email' && isValidEmailSecret) {
                await this.userService.updateUser(user._id, { tempSecret: null, isEmailVerified: true, isActive: true })

                return res.json({ success: true, email: true })
            }

            // if (type == 'phone' && isValidPhoneSecret) {
            //     console.log('just phone')

            //     await this.userService.updateUser(user._id, { isPhoneVerified: true })
            //     return res.json({ success: true, phone: true })
            // }

            throw new BadRequestException()

        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } })
        }
    }

    @Post('verify-otp-user/v2')
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

            if (updatedData['address'] && user.address.country == updatedData.address.country) {

                await this.userService.updateUser(user._id, { address: updatedData.address })
                res.json({ success: true })
                return
            }

            console.log("username, updatedData, otp, type", username, updatedData, otp, type)

            // let isValidPhoneSecret = await this.otpService.verifyOtp(user._id, otp, 'phone')
            let isValidEmailSecret = await this.otpService.verifyOtp(user._id, otp, 'email')

            if (!isValidEmailSecret) {
                throw new BadRequestException("OTP is not valid")
            }


            if (type == 'email' && updatedData['changePassword']) {
                console.log('updating password', updatedData.changePassword)
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
                await this.userService.updateUser(user._id, { email: updatedData.email, isEmailVerified: true })
                res.json({ success: true })
                return
            }

            if (type == 'email' && updatedData['address']) {
                await this.userService.updateUser(user._id, { address: updatedData.address })
                res.json({ success: true })
                return
            }

            if (type == 'email' && updatedData['phone']) {
                await this.userService.updateUser(user._id, { phone: updatedData.phone })
                res.json({ success: true })
                return
            }


            throw new BadRequestException()

        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } })
        }
    }

    @Post('change-current-password/v2')
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
            if (isValidPassword) {
                let hashedPassword = await this.cryptoService.hash(changePassword.password, 16)
                await this.userService.updateUser(user._id, { password: hashedPassword })
                res.json({ success: true })
                return
            }
            throw new BadRequestException("invalid current password")

        } catch (error) {
            console.log(error)
            // if (error.name == "MongoServerError" && error.code == 11000) {
            //     // res.status(400).json({ success: false, error: { message: error.keyPattern['email'] ? "Email Already Taken" : "Phone Already Taken" } })
            //     res.status(400).json({ success: false, error: { message: "Phone Already Taken" } })
            //     return
            // }
            res.status(400).json({ success: false, error: { message: error.message } })
        }
    }

    @Post('forget-password/v2')
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


            // let isValidPhoneSecret = await this.otpService.verifyOtp(user._id, otp, 'phone')
            let isValidEmailSecret = await this.otpService.verifyOtp(user._id, otp, 'email')

            if (!isValidEmailSecret) {
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
    @Post('forget-password-request/v2')
    async forgetPasswordRequest(
        @Body(new ZodValidationPipe(ForgetPasswordRequest)) changePasswordDTO: ForgetPasswordRequestDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { username } = changePasswordDTO

        try {
            const user = await this.userService.findUser(username)

            if (!user) {
                throw new BadRequestException("User account deos not exist with this username")
            }

            if (!user.email) {
                throw new BadRequestException("Your account doesn't have email. Contact us.")
            }

            const authId = uuidv4()

            await this.cacheService.setForgetPassword(user._id, authId)
            const link = `https://www.freedombook.co/reset-password/${authId}?username=${user.username}`
            const message = messageGenerator(user.firstname + " " + user.lastname, link, 'reset-password')
            // await this.twilioService.sendSMS(user.phone, message)
            await this.twilioService.sendEmail({
                to: user.email,
                from: process.env.VERIFY_EMAIL,
                subject: "OTP Verification",
                text: message
                // html: emailData.html,
            })
            return res.json({ success: true, message: "otp has been sent to your email" })

            // return res.json({ success: true, message: "otp has been sent to your phone" })

        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } })
        }
    }

    @Public()
    @Post('forget-password-open/v2')
    async forgetPasswordPub(
        @Body(new ZodValidationPipe(ForgetPasswordPub)) changePasswordDTO: ForgetPasswordPubDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { username, authId, changePassword } = changePasswordDTO

        try {
            const user = await this.userService.findUser(username)
            if (!user) {
                throw new BadRequestException()
            }

            // if (!otp || !type || !changePassword) {
            //     throw new BadRequestException()
            // }

            // let isValidPhoneSecret = await this.otpService.verifyOtp(user._id, otp, 'phone')
            // let isValidEmailSecret = await this.otpService.verifyOtp(user._id, otp, 'email')

            // if (!isValidPhoneSecret) {
            //     throw new BadRequestException("OTP is not valid")
            // }

            let _authId = await this.cacheService.getForgetPassword(user._id)
            console.log(authId, _authId)

            if (authId !== _authId) {
                throw new BadRequestException("Link has been expired")
            }


            if (_authId) {
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
    @Post('resend-otp/v2')
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
                let emailOTP = await this.otpService.generateOtp(user._id, 'email')
                const message = messageGenerator(user.firstname + " " + user.lastname, emailOTP)

                await this.twilioService.sendEmail({
                    to: user.email,
                    from: process.env.VERIFY_EMAIL,
                    subject: "OTP Verification",
                    text: `Your email otp code is: ${emailOTP} `,
                    // html: emailData.html,
                })
                return res.json({ success: true, message: "otp has been sent to your email" })
            }


            // {phone otp}
            // if (type == 'phone') {
            //     let phoneOTP = await this.otpService.generateOtp(user._id, 'phone')
            //     console.log(phoneOTP, 'phone')
            //     console.log(user.phone)
            //     const message = messageGenerator(user.firstname + " " + user.lastname, phoneOTP)
            //     await this.twilioService.sendSMS(user.phone, message)
            //     return res.json({ success: true, message: "otp has been sent to your phone" })
            // }

            throw new BadRequestException()
        } catch (err) {
            res.status(err.statusCode || 500).json({ success: false, message: err.message })
        }
    }


    @Post('resend-otp-user/v2')
    async resendOTPUser(
        @Body(new ZodValidationPipe(resendOTPUser)) resendOTPDTO: resendOTPUserDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const { username, type, email } = resendOTPDTO
        try {
            const user = await this.userService.findUser(username)
            if (!user) {
                throw new BadRequestException("User not found")
            }

            if (!email && !user?.email) {
                throw new BadRequestException("Please first add email address in your account.")
            }

            if (type == 'email') {
                let emailOTP = await this.otpService.generateOtp(user._id, 'email')
                const message = messageGenerator(user.firstname + " " + user?.lastname, emailOTP)
                await this.twilioService.sendEmail({
                    to: email || user.email,
                    from: process.env.VERIFY_EMAIL,
                    subject: "OTP Verification",
                    text: message
                    // html: emailData.html,
                })
                console.log(emailOTP, 'email')
                return res.json({ success: true, message: "otp has been sent to your email" })
            }

            // if (type == 'phone') {
            //     let phoneOTP = await this.otpService.generateOtp(user._id, 'phone')
            //     console.log(phoneOTP, 'phone send to', (phone || user.phone))
            //     console.log(phone || user.phone)
            //     const message = messageGenerator(user.firstname + " " + user?.lastname, phoneOTP)
            //     console.log(message)
            //     await this.twilioService.sendSMS(user.phone, message)
            //     return res.json({ success: true, message: "otp has been sent to your phone" })
            // }

            throw new BadRequestException()
        } catch (err) {
            console.log(err)
            res.status(err.statusCode || 500).json({ success: false, message: err.message })
        }
    }


    @Public()
    @Post('login/v2')
    async loginUser(
        @Body(new ZodValidationPipe(LoginUser)) loginUserDTO: LoginUserDTO,
        @Req() req: Request,
        @Res({ passthrough: true }) response: Response) {
        const { username, password } = loginUserDTO
        const user = await this.authService.validateUser(username?.trim(), password?.trim())

        const payload = await this.authService.login(user)

        response.cookie("accessToken", payload.access_token, {
            sameSite: 'strict',
            maxAge: 7 * 60 * 60 * 1000
        }).json({
            access_token: payload.access_token
        })
    }

    @Public()
    @Post('login/phone')
    async loginUserWithPhone(
        @Body(new ZodValidationPipe(LoginUser)) loginUserDTO: LoginUserDTO,
        @Req() req: Request,
        @Res({ passthrough: true }) response: Response) {
        // username here is a phone number from user
        const { username, password } = loginUserDTO
        const user = await this.authService.validateUser(username, password)

        console.log('validate user', user)
        const payload = await this.authService.login(user)
        console.log('payload ', payload)

        response.cookie("accessToken", payload.access_token, {
            sameSite: 'strict',
            maxAge: 7 * 60 * 60 * 1000
        }).json({
            access_token: payload.access_token
        })
    }

    @Post('logout')
    async logoutUser(
        @Req() req: Request,
        @Res({ passthrough: true }) response: Response) {
        response.clearCookie('accessToken', { sameSite: 'strict', })
        response.json({ success: true })
    }

    @Public()
    @Post("refresh-token")
    async refreshToken(
        @Req() req: Request,
        @Res() res: Response) {
        const accessToken = req.cookies.accessToken
        console.log(accessToken)

        // if (!refreshToken) {
        //     throw new BadRequestException("something went wrong")
        // }

        // console.log(refreshToken, 'refresh')
        // const accessToken = await this.authService.refreshToken(refreshToken)
        // res.json({ accessToken })
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
        res.json(user[0] || null)
    }


    @Get("areFriends")
    async areFriends(
        @Query(new ZodValidationPipe(GetUser)) { friendId }: areFriendsDTO,
        @Req() req: Request,
        @Res() res: Response) {
        const areFriends = await this.userService.areFriends(req.user.sub, req.query.friendId as string)
        res.json(areFriends)
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


    @Get("onlineStatus")
    async onlineStatus(
        @Query() query: { userId: string },
        @Req() req: Request,
        @Res() response: Response) {
        const userId = query.userId
        console.log(query)
        console.log(userId)
        let online = await this.cacheService.getOnlineUser(userId)
        let offline = await this.cacheService.getOfflineUser(userId)
        // if (online) {
        // console.log('yes socket id found', online)
        // if (this.server.sockets.sockets.has(online?.socketId)) {
        // console.log('no user is not onlien')
        // response.json(online)
        // return
        // }
        // await this.cacheService.setUserOffline(userId)
        // }

        console.log(online, 'online')
        console.log(offline, 'offline')
        response.json(online || offline)
    }

    @Post("pushToken")
    async userPushToken(
        @Body() body: { pushToken: string },
        @Req() req: Request,
        @Res() response: Response) {
        const pushToken = body.pushToken
        const isValidExpoPushToken = Expo.isExpoPushToken(pushToken)

        console.log(pushToken, isValidExpoPushToken, 'isvalid push token')
        if (isValidExpoPushToken) {
            this.cacheService.setUserPushToken(req.user.sub, pushToken)
            return response.json({ success: true, message: 'User push token stored successfully' })
        }

        throw new BadRequestException()
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

    private async deleteProfile(profile: string) {
        let userProfile = profile.split('/')
        console.log(`deleting ${userProfile}, from s3...`)

        let profileFilename = userProfile[userProfile.length - 1]

        console.log(profileFilename, 'filenames')

        console.log(`deleting ${profileFilename} from s3...`)
        const deleted = await this.uploadService.deleteFromS3(profileFilename)
        console.log(deleted, 'deleted')
        if (!deleted) {
            throw new InternalServerErrorException("Failed to delete profile image from S3")
        }
        return true
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

        const _user = await this.userService.getRawUser(sub)
        if (!_user) {
            throw new BadRequestException("User not found")
        }

        let images = {}
        if (!updateUserDTO) {
            throw new BadRequestException("No data provided to update user")
        }

        if (updateUserDTO.profile === null && !file) {
            if (_user.profile) {
                await this.deleteProfile(_user.profile)
            }
        }
        if (updateUserDTO.cover === null && !file) {
            if (_user.cover) {
                await this.deleteProfile(_user.cover)
            }
        }

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

        let user = await this.userService.updateUser(sub, { ...updateUserDTO, ...images })

        if (updateUserDTO.username) {
            const accessToken = await this.authService.accessToken({ username: user.username, userId: user._id.toString() })
            return res.cookie("accessToken", accessToken, {
                sameSite: 'strict',
                maxAge: 7 * 60 * 60 * 1000
            }).json({
                user
            })
        }
        res.json({ user })
    }

    @Post("delete")
    async deleteUser(@Req() req) {
        return await this.userService.deleteUser(req.user.sub)
    }
}
