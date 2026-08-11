import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { ProjetsModule } from './projets/projets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CollaborationsModule } from './collaborations/collaborations.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { BugsModule } from './bugs/bugs.module';

@Module({
  imports: [PrismaModule, UsersModule,ConfigModule.forRoot({
      isGlobal: true,
    }), MailModule, ProjetsModule, NotificationsModule, CollaborationsModule, CloudinaryModule, BugsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
