import { Test, TestingModule } from '@nestjs/testing';
import { CgroupController } from './cgroup.controller';
import { CgroupService } from './cgroup.service';

describe('CgroupController', () => {
  let controller: CgroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CgroupController],
      providers: [CgroupService],
    }).compile();

    controller = module.get<CgroupController>(CgroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
