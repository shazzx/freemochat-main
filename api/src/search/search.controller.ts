import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { SearchService } from './search.service';
import { Request } from 'types/global';
import { ZodValidationPipe } from 'src/zod-validation.pipe';
import { Search, SearchDTO } from 'src/schema/validation/search';

@Controller('search')
export class SearchController {

    constructor(private searchService: SearchService) { }


    @Get()
    async search(
        @Query('query') query: string,
        @Query('type') type?: 'all' | 'users' | 'groups' | 'pages' | 'posts',
        @Query('limit') limit = 5,
        @Query('skip') skip = 0,
    ) {
        return this.searchService.search(query, type, limit, skip);
    }

    // @Get('suggestions')
    // async suggestions(@Query() searchDTO: SearchDTO, @Req() req: Request, @Res() response: Response) {
    //     let { query } = searchDTO

    //     const results = await this.searchService.searchSuggestions(query)
    //     console.log(results)
    //     response.json(results)
    // }
}
