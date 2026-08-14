import { Injectable ,NotFoundException} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class NotificationsService {
    constructor(private prisma:PrismaService){}

  //..................creer une notif..............
  async creerNotifications(utilisateurId:number,titre:string,contenu:string){
    return this.prisma.notification.create({
      data:{utilisateurId,titre,contenu}
    })
  }
  //----------------lister les notif d'un utilisteur---------------
  async listerNotifUtilisateur(utilisateurId:number){
    return this.prisma.notification.findMany({
      where:{utilisateurId:utilisateurId},
      orderBy:{dateEnvoie:'desc'}
    })
  }

  async marquerCommeLue(id: number, utilisateurId: number) {
  const notif = await this.prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.utilisateurId !== utilisateurId) throw new NotFoundException('Notification introuvable');
  return this.prisma.notification.update({ where: { id }, data: { lue: true } });
}

async marquerToutesCommeLues(utilisateurId: number) {
  await this.prisma.notification.updateMany({ where: { utilisateurId, lue: false }, data: { lue: true } });
  return { message: 'Toutes les notifications ont été marquées comme lues' };
}
async supprimerNotification(id: number, utilisateurId: number) {
  const notif = await this.prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.utilisateurId !== utilisateurId) {
    throw new NotFoundException('Notification introuvable');
  }
  await this.prisma.notification.delete({ where: { id } });
  return { message: 'Notification supprimée' };
}
}
