import { Test, TestingModule } from '@nestjs/testing';
import { BackgroundjobsService } from './backgroundjobs.service';

describe('BackgroundjobsService', () => {
  let service: BackgroundjobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackgroundjobsService],
    }).compile();

    service = module.get<BackgroundjobsService>(BackgroundjobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
