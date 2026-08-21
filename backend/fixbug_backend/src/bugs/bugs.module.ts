import { Module } from '@nestjs/common';
import { BugsController } from './bugs.controller';
import { BugsService } from './bugs.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AgentIaModule } from 'src/agent-ia/agent-ia.module';

@Module({
 imports: [CloudinaryModule,AgentIaModule],
  controllers: [BugsController],
  providers: [BugsService]
})
export class BugsModule {}
