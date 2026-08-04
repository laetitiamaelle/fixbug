import { Test, TestingModule } from '@nestjs/testing';
import { ProjetsController } from './projets.controller';

describe('ProjetsController', () => {
  let controller: ProjetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjetsController],
    }).compile();

    controller = module.get<ProjetsController>(ProjetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
