import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SearchService } from './search.service';
// import { sendEmail } from 'src/utils/sendEmail';

@Controller('search')
export class SearchController {

    constructor(private searchService: SearchService) { }

    @Get()
    async loginUser(@Req() req: Request, @Res() response: Response) {
        let query = req.query as { query: string, type: string }
        const {sub} = req.user as {sub: string}
        const results = await this.searchService.search(query, sub)
        response.json(results)
    }
}
