import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { SearchService } from './search.service';
import { Request } from 'types/global';
import { SearchDTO } from 'src/schema/validation/search';
import { HashtagService } from 'src/hashtag/hashtagservice';

@Controller('search')
export class SearchController {

    constructor(
        private searchService: SearchService,
        private hashtagService: HashtagService
    ) { }

    @Get()
    async search(
        @Query('query') query: string,
        @Query('type') type?: 'all' | 'users' | 'groups' | 'pages' | 'posts' | 'hashtags',
        @Query('limit') limit = 5,
        @Query('skip') skip = 0,
    ) {
        return this.searchService.search(query, type, limit, skip);
    }

    @Get('suggestions')
    async suggestions(@Query() searchDTO: SearchDTO, @Req() req: Request, @Res() response: Response) {
        let { query } = searchDTO

        const results = await this.searchService.searchSuggestions(query)
        response.json(results)
    }

    @Get('mention-suggestions')
    async mentionSuggestions(@Query() searchDTO: SearchDTO, @Req() req: Request, @Res() response: Response) {
        let { query } = searchDTO

        const results = await this.searchService.searchMentionSuggestions(query)
        response.json(results)
    }

    @Get('trending-hashtags')
    async trendingHashtags(@Query('limit') limit: number = 5, @Res() response: Response) {
        const hashtags = await this.searchService.getTrendingHashtags(limit);
        console.log(hashtags, 'hashtags controller result')
        response.json(hashtags);
    }

    @Get('hashtag-suggestions')
    async hashtagSuggestions(
        @Query('query') query: string,
        @Query('limit') limit: number = 10,
        @Res() response: Response
    ) {
        const hashtags = await this.searchService.searchHashtagSuggestions(query, limit);
        response.json(hashtags);
    }

    @Get('hashtag-posts')
    async hashtagPosts(
        @Req() req: Request,
        @Res() response: Response,
        @Query('hashtag') hashtag: string,
        @Query('cursor') cursor?: string,
        @Query('limit') limit: number = 10,
    ) {
        const user = req.user;
        const result = await this.hashtagService.getPostsByHashtag(hashtag, user.sub, Number(limit), cursor);
        response.json(result);
    }

    @Get('hashtag-details')
    async hashtagDetails(
        @Query('name') name: string,
        @Res() response: Response
    ) {
        const hashtag = await this.searchService.getHashtagDetails(name);
        response.json(hashtag);
    }

    @Get('hashtag-stats')
    async hashtagStats(@Res() response: Response) {
        const stats = await this.hashtagService.getHashtagStats();
        response.json(stats);
    }
}