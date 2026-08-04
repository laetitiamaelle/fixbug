import { Test, TestingModule } from '@nestjs/testing';
import { ProjetsService } from './projets.service';

describe('ProjetsService', () => {
  let service: ProjetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjetsService],
    }).compile();

    service = module.get<ProjetsService>(ProjetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
