import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { MetricsAggregatorService } from './metrics-aggregator.service';
import { Public } from 'src/auth/public.decorator';
import { Request, Response } from 'express'

@Controller('metrics-aggregator')
export class MetricsAggregatorController {
  constructor(private readonly metricsAggregatorService: MetricsAggregatorService) { }


  // @Public()
  @Get("user/metrics")
  async getAll(@Req() req: Request, @Res() res: Response) {
    const {sub} = req.user as {sub: string}
    res.json(await this.metricsAggregatorService.userMetrics(sub))
  }

  @Post("user/metrics/default")
  async default(@Req() req: Request, @Res() res: Response) {
    const {sub} = req.user as {sub: string}
    const {name} = req.body
    console.log(name)
    res.json(await this.metricsAggregatorService.defaultCount(sub, name, 'user'))
  }

  // @Public()
  // @Get("delete")
  // async deleteAll(@Req() req: Request, @Res() res: Response) {
  //   res.json(await this.metricsAggregatorService.deleteAll())
  // }
}
