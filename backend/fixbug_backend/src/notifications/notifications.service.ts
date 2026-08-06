import { Injectable } from '@nestjs/common';
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
}
