import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { Request } from 'types/global';
import { SearchDTO } from 'src/schema/validation/search';
import { HashtagService } from 'src/hashtag/hashtagservice';

@Controller('hashtag')
export class HashtagController {

    constructor(
        private hashtagService: HashtagService
    ) { }

    @Get()
    async suggestions(@Query() { name }: { name: string }, @Req() req: Request, @Res() response: Response) {
        const results = await this.hashtagService.getHashtagByName(name)
        response.json(results)
    }
}