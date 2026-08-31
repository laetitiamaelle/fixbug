import { Test, TestingModule } from '@nestjs/testing';
import { IaProviderService } from './ia-provider.service';

describe('IaProviderService', () => {
  let service: IaProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IaProviderService],
    }).compile();

    service = module.get<IaProviderService>(IaProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
