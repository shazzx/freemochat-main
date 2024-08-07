import { Test, TestingModule } from '@nestjs/testing';
import { BackgroundjobsController } from './backgroundjobs.controller';
import { BackgroundjobsService } from './backgroundjobs.service';

describe('BackgroundjobsController', () => {
  let controller: BackgroundjobsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackgroundjobsController],
      providers: [BackgroundjobsService],
    }).compile();

    controller = module.get<BackgroundjobsController>(BackgroundjobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
