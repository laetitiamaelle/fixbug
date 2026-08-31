import { Module } from '@nestjs/common';
import { AgentIaService } from './agent-ia.service';
import { AgentIaController } from './agent-ia.controller';
import { IaProviderService } from './ia-provider/ia-provider.service';

@Module({
  providers: [AgentIaService,IaProviderService],
  controllers: [AgentIaController],
  exports: [AgentIaService]
})
export class AgentIaModule {}
