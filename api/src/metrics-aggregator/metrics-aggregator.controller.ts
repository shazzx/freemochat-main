import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
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

  @Get("user/contributions")
  async userContributions(@Req() req: Request, @Res() res: Response) {
    const { sub } = req.user as { sub: string }
    res.json(await this.metricsAggregatorService.userContributions(sub))
  }

  @Post("user/metrics/default")
  async default(@Req() req: Request, @Res() res: Response) {
    const { sub } = req.user as { sub: string }
    const { name, targetId } = req.body
    res.json(await this.metricsAggregatorService.defaultCount(targetId || sub, name, 'user'))
  }
}
