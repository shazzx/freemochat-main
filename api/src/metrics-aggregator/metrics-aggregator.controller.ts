import { Controller, Get, Req, Res } from '@nestjs/common';
import { MetricsAggregatorService } from './metrics-aggregator.service';
import { Public } from 'src/auth/public.decorator';
import { Request, Response } from 'express'

@Controller('metrics-aggregator')
export class MetricsAggregatorController {
  constructor(private readonly metricsAggregatorService: MetricsAggregatorService) { }


  @Public()
  @Get("")
  async getAll(@Req() req: Request, @Res() res: Response) {
    res.json(await this.metricsAggregatorService.getAll())
  }


  @Public()
  @Get("delete")
  async deleteAll(@Req() req: Request, @Res() res: Response) {
    res.json(await this.metricsAggregatorService.deleteAll())
  }
}
