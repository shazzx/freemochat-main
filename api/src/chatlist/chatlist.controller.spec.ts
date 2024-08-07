import { Test, TestingModule } from '@nestjs/testing';
import { ChatlistController } from './chatlist.controller';

describe('ChatlistController', () => {
  let controller: ChatlistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatlistController],
    }).compile();

    controller = module.get<ChatlistController>(ChatlistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
