import { Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import { MetricsAggregatorService } from './metrics-aggregator.service';
import { Public } from 'src/auth/public.decorator';
import { Request, Response } from 'express'

@Controller('metrics-aggregator')
export class MetricsAggregatorController {
  constructor(private readonly metricsAggregatorService: MetricsAggregatorService) { }


  @Get("user/metrics")
  async getAll(@Req() req: Request, @Res() res: Response) {
    const { sub } = req.user as { sub: string }
    res.json(await this.metricsAggregatorService.userMetrics(sub))
  }

  @Get("global/contributions")
  async countryContributions(
    @Res() res: Response
  ) {
    res.json(await this.metricsAggregatorService.getCountryContributions())
  }

  @Get("contributions/:targetId")
  async userContributions(
    @Param('targetId') targetId: string,
    @Res() res: Response
  ) {
    res.json(await this.metricsAggregatorService.userAndPageContributions(targetId))
  }

  @Post("user/metrics/default")
  async default(@Req() req: Request, @Res() res: Response) {
    const { sub } = req.user as { sub: string }
    const { name, targetId } = req.body
    res.json(await this.metricsAggregatorService.defaultCount(targetId || sub, name, 'user'))
  }


  @Get("countries/search")
  async searchCountries(
    @Query('q') searchQuery: string,
    @Res() res: Response
  ) {

    if (!searchQuery || searchQuery.trim().length < 1) {
      return res.status(400).json({ error: 'Search query is required and must be at least 1 character long.' });
    }
    console.log(searchQuery.trim());

    const result = await this.metricsAggregatorService.searchCountries(searchQuery.trim());
    res.json(result);
  }
}
