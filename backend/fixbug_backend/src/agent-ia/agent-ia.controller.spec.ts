import { Test, TestingModule } from '@nestjs/testing';
import { AgentIaController } from './agent-ia.controller';

describe('AgentIaController', () => {
  let controller: AgentIaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentIaController],
    }).compile();

    controller = module.get<AgentIaController>(AgentIaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
