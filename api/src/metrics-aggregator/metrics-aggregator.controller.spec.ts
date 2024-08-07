import { Test, TestingModule } from '@nestjs/testing';
import { MetricsAggregatorController } from './metrics-aggregator.controller';
import { MetricsAggregatorService } from './metrics-aggregator.service';

describe('MetricsAggregatorController', () => {
  let controller: MetricsAggregatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsAggregatorController],
      providers: [MetricsAggregatorService],
    }).compile();

    controller = module.get<MetricsAggregatorController>(MetricsAggregatorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
