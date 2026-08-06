import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CollaborationsService {
    constructor(private prisma: PrismaService, private notifications: NotificationsService) { }

    // verifier proprietaire projet
    private async verifierProprietaire(projetId: number, chefProjetId: number) {
        const projet = await this.prisma.projet.findUnique({
            where: { id: projetId }
        })
        if (!projet) {
            throw new NotFoundException("projet introuvable")
        }
        if (projet?.chefProjetId !== chefProjetId) {
            throw new ForbiddenException('vous n\'etes pas le proprietaire du projet')
        }
        
        return projet
    }

    //------------inviter un collaborateur-----------

    async inviterCollaborateur(projetId: number, chefProjetId: number, utilisateurId: number) {
        const projet = await this.verifierProprietaire(projetId, chefProjetId)
        const invitationExite = await this.prisma.invitation.findFirst({
            where: {
                projetId: projetId,
                utilisateurId: utilisateurId,
                statut: 'EN_ATTENTE'
            }
        });
        if (invitationExite) {
            throw new ConflictException("une invitationa deja ete envoyer a cette utilisateur")
        } else {
            const invitation = await this.prisma.invitation.create({
                data: {
                    projetId: projetId,
                    utilisateurId: utilisateurId
                }
            });

            await this.notifications.creerNotifications(utilisateurId, "invitation au projet", `vous avez ete invite au projet ${projet.nom}`)
            return invitation
        }
    }

    //----------lister les collaborateurs d'un projet --------------
    async listerCollaborateur(projetId, chefProjetId) {
        await this.verifierProprietaire(projetId, chefProjetId)
        return this.prisma.projetCollaborateur.findMany({
            where: { projetId: projetId },
            include: {
                utilisateur: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true
                    }
                }
            }
        })
    }
    //-----------retirer un collaborateur-------------

    async retirerCollaborateur(projetId: number, chefProjetId: number, utilisateurId: number) {
        await this.verifierProprietaire(projetId, chefProjetId)
        try {
            await this.prisma.projetCollaborateur.delete({
                where: { projetId_utilisateurId: { projetId, utilisateurId } }
            })
             await this.notifications.creerNotifications(utilisateurId, " ", `vous avez ete retirer d'un projet `)
            return { message: 'collaborateur retire avec succes' }
        } catch {
            throw new NotFoundException(" cette utilisateur n'est pas collaborateur de ce projet")
        }
    }

    //------------lister lesinvitations dun testeur-------
    async listerInvitationsTesteur(utilisateurId){
        return await this.prisma.invitation.findMany({
            where:{
                utilisateurId,
                statut:"EN_ATTENTE"
            },
            include:{projet:{select:{id:true,nom:true,description:true}}},
            orderBy:{dateEnvoie:'desc'}
        })
    }

    // verifier le proprietaire d'une invitation
   private  async verifierProprietaireInvitation(utilisateurId,invitationId){
    const invitation = await this.prisma.invitation.findFirst({
        where:{id:invitationId}
    })
    if(!invitation){
        throw new NotFoundException("cette invitation n'existe pas")
    }
    if(invitation.utilisateurId!== utilisateurId){
        throw new ForbiddenException("vous n'etes pas le proprietaire de cette invitation")
    }
    if(invitation.statut!=='EN_ATTENTE'){
        throw new ConflictException("cette invitation a deja ete traiter")
    }
    return invitation
   }

   // ------------ refuser invitattion-----------
    async refuserInvitation(invitationId,utilisateurId){
     await this.verifierProprietaireInvitation(utilisateurId,invitationId)
     await this.prisma.invitation.update({
        where:{id:invitationId},
        data:{statut:'REFUSEE'}
    })
     return {message:`vous avez refuse l'invitation au projet`}
    }

    //------------accepter invitattion------------
     async AccepteInvitation(invitationId,utilisateurId){
     const invitation = await this.verifierProprietaireInvitation(utilisateurId,invitationId)
     await this.prisma.invitation.update({
        where:{id:invitationId},
        data:{statut:'ACCEPTEE'}
    })
      await this.prisma.projetCollaborateur.create({
        data:{projetId:invitation.projetId,utilisateurId}
      })
     return {message:`vous avez accepter l'invitation au projet`}
    }
}
