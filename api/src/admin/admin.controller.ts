import { BadRequestException, Body, Controller, Get, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Request, Response } from 'express';
import { AuthService } from './auth/auth.service';
import { IsAdminRoute } from './utils/isAdminRoute.decorator';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService, 
        private readonly authService: AuthService,
    ) {}

    @IsAdminRoute()
    @Post('login')
    async loginUser(@Req() @Req() req: Request, @Res({ passthrough: true }) response: Response) {
        try {
            
        const { username, password } = req.body
        const user = await this.authService.validateUser(username, password)
        const payload = await this.authService.login(user)

        response.cookie("admin-rf-token", payload.refresh_token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        }).json({
            access_token: payload.access_token, user
        })
        } catch (error) {
          console.log(error)  
        }
    }


    @IsAdminRoute()
    @Post("refresh-token")
    async refreshToken(@Req() @Req() req: Request, @Res() response: Response) {
        const refreshToken = req.cookies['admin-rf-token']
        if (!refreshToken) {
            return new BadRequestException("something went wrong")
        }

        const accessToken = await this.authService.refreshToken(refreshToken)
        return response.json({ accessToken })
    }


    @IsAdminRoute()
    @Get()
    async admin(@Req() req: Request, @Res() response: Response) {
        const {admin} = req as any
        response.json(await this.adminService.getAdmin("freedombook@admin"))
    }

    @IsAdminRoute()
    @Post('create')
    async createAdmin(@Req() req: Request, @Res() response: Response) {
        const { firstname, lastname, username, password, email } = req.body
        response.json(await this.adminService.createAdmin({ firstname: 'shahzad', lastname: 'ali', username: "shazzadmin", password: "shazzadmin", email: 'shazzadmin@gmail.com' }))
    }


    @IsAdminRoute()
    @UseGuards(JwtAuthGuard)
    @Get("reports")
    async reports(@Req() req: Request, @Res() response: Response) {
        const { cursor, search } = req.query as { cursor: string, search: string }
        response.json(await this.adminService.getReports(cursor, search))
    }



    @IsAdminRoute()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    @Post("update")
    async updateUser(@Req() req: Request, @Res() res: Response, @UploadedFile() file: Express.Multer.File,
        @Body("adminData") adminData: string,
        resposne: Response) {
        const _adminData = adminData ? JSON.parse(adminData) : {}
        const { admin }: any = req
        const { sub } = admin
        let user = await this.adminService.updateAdmin(sub, _adminData, file)
        res.json(user)
    }

    @IsAdminRoute()
    @UseGuards(JwtAuthGuard)
    @Get("campaigns")
    async campaigns(@Req() req: Request, @Res() response: Response) {
        const { cursor, search } = req.query as { cursor: string, search: string }
        response.json(await this.adminService.getCampaigns(cursor, search))
    }


    @IsAdminRoute()
    @UseGuards(JwtAuthGuard)
    @Get("campaigns/refund")
    async campaignsRefund(@Req() req: Request, @Res() response: Response) {
        const { cursor, search } = req.query as { cursor: string, search: string }
        response.json(await this.adminService.getCampaigns(cursor, search))

    }


    @IsAdminRoute()
    @UseGuards(JwtAuthGuard)
    @Post("report")
    async createReport(@Req() req: Request, @Res() response: Response) {
        const { reportId, reportData } = req.body
        response.json(await this.adminService.reportPost(reportId, reportData))
    }

    @IsAdminRoute()
    @UseGuards(JwtAuthGuard)
    @Post("report/remove")
    async reportRemove(@Req() req: Request, @Res() response: Response) {
        const { reportId } = req.body
        response.json(await this.adminService.removeReport(reportId))
    }

    @IsAdminRoute()
    @UseGuards(JwtAuthGuard)
    @Get("dashboardData")
    async dashboardData(@Req() req: Request, @Res() response: Response) {
        response.json(await this.adminService.getDashboardData())
    }
}