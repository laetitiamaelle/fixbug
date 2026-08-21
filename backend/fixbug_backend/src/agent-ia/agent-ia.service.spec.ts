import { Test, TestingModule } from '@nestjs/testing';
import { AgentIaService } from './agent-ia.service';

describe('AgentIaService', () => {
  let service: AgentIaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentIaService],
    }).compile();

    service = module.get<AgentIaService>(AgentIaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
