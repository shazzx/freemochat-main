import { Test, TestingModule } from '@nestjs/testing';
import { CGroupsController } from './cgroups.controller';

describe('CgroupsController', () => {
  let controller: CGroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CGroupsController],
    }).compile();

    controller = module.get<CGroupsController>(CGroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
