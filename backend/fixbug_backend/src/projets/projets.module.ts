import { Module } from '@nestjs/common';
import { ProjetsController } from './projets.controller';
import { ProjetsService } from './projets.service';

@Module({
  controllers: [ProjetsController],
  providers: [ProjetsService]
})
export class ProjetsModule {}
