import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';
@Global()
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {
  
}
