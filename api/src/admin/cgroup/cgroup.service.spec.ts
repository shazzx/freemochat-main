import { Test, TestingModule } from '@nestjs/testing';
import { CgroupService } from './cgroup.service';

describe('CgroupService', () => {
  let service: CgroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CgroupService],
    }).compile();

    service = module.get<CgroupService>(CgroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
