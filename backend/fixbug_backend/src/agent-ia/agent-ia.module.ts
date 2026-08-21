import { Module } from '@nestjs/common';
import { AgentIaService } from './agent-ia.service';
import { AgentIaController } from './agent-ia.controller';

@Module({
  providers: [AgentIaService],
  controllers: [AgentIaController],
  exports: [AgentIaService]
})
export class AgentIaModule {}
