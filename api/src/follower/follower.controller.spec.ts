import { Test, TestingModule } from '@nestjs/testing';
import { FollowerController } from './follower.controller';
import { FollowerService } from './follower.service';

describe('FollowerController', () => {
  let controller: FollowerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowerController],
      providers: [FollowerService],
    }).compile();

    controller = module.get<FollowerController>(FollowerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
