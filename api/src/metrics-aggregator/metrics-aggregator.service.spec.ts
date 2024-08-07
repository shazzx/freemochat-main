import { Test, TestingModule } from '@nestjs/testing';
import { MetricsAggregatorService } from './metrics-aggregator.service';

describe('MetricsAggregatorService', () => {
  let service: MetricsAggregatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsAggregatorService],
    }).compile();

    service = module.get<MetricsAggregatorService>(MetricsAggregatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
