import { Controller, Get, UseGuards,Patch,Param,ParseIntPipe, Delete } from '@nestjs/common';
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
  @Patch(':id/lue')
marquerCommeLue(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: { id: number }) {
  return this.notificationsService.marquerCommeLue(id, u.id);
}

@Patch('tout-marquer-lu')
marquerToutesCommeLues(@CurrentUser() u: { id: number }) {
  return this.notificationsService.marquerToutesCommeLues(u.id);
}
@Delete(':id')
supprimerNotification(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: { id: number }) {
  return this.notificationsService.supprimerNotification(id, u.id);
}
}