import { Controller, Get, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/users/guards/jwt-auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  mesNotifications(@CurrentUser() utilisateur: { id: number }) {
    return this.notificationsService.listerNotifUtilisateur(utilisateur.id)
  }
}