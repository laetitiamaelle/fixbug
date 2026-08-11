import { Module } from '@nestjs/common';
import { BugsController } from './bugs.controller';
import { BugsService } from './bugs.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
 imports: [CloudinaryModule],
  controllers: [BugsController],
  providers: [BugsService]
})
export class BugsModule {}
