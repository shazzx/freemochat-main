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
    async search(@Query(new ZodValidationPipe(Search)) searchDTO: SearchDTO, @Req() req: Request, @Res() response: Response) {
        let { type, query } = searchDTO
        const { sub } = req.user
        
        const results = await this.searchService.search({ type, query }, sub)
        response.json(results)
    }
}
