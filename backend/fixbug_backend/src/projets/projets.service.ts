import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreerProjetDto } from './DTO/creer-projet.dto';
import { NotFoundError } from 'rxjs';
import { ModifierProjetDto } from './DTO/modifier-projet.dto';

@Injectable()

export class ProjetsService {
    constructor(private prisma: PrismaService) { }

    // ---------------------creer un projet-------------------
    async creerProjet(chefProjetId: number, projet: CreerProjetDto) {
        console.log('--- DEBUG CREATION PROJET ---');
        console.log('chefProjetId:', chefProjetId, typeof chefProjetId);
        console.log('projet DTO:', projet);
        return this.prisma.projet.create({
            data: {
                nom: projet.nom,
                description: projet.description,
                liengit: projet.lienGithub,
                technologies: projet.technologies ?? [],
                chefProjetId,
            },
        })

    }

    //------------------lister projet----------------------
    async listeProjet(utilisateur: { id: number, role: string }) {
        if (utilisateur.role === 'CHEF_PROJET') {
            return this.prisma.projet.findMany({
                where: { chefProjetId: utilisateur.id },
                orderBy: { createdAt: 'desc' }
            })
        }
//----lister les projets d'un testeur
        return this.prisma.projet.findMany({
            where: { collaborateurs: { some: { utilisateurId: utilisateur.id } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    //----------------rechercher projets------------

    async rechercherProjet(utilisateur:{id:number,role:string},motRecherche:string){
        if(utilisateur.role === 'CHEF_PROJET'){
         return this.prisma.projet.findMany({
            where:{
                chefProjetId:utilisateur.id,
                nom:{contains:motRecherche,mode:'insensitive'}
            
        },
            orderBy:{
                createdAt:'desc'
            }
         })
        }
        return this.prisma.projet.findMany({
            where:{
               collaborateurs:{
                some: { utilisateurId:utilisateur.id}
               },
               nom:{contains:motRecherche,mode:'insensitive'}
            },
            orderBy:{createdAt:'desc'}
        })
    }


    // fonction pour verifer le proprietaire d'un projet

    private async verifierProprietaire(projetId:number, chefProjetId:number){
        const projet= await this.prisma.projet.findUnique({
            where:{id:projetId}
        })

        if(!projet){
            throw new NotFoundException("le projet est introuvable")
        }
        if(projet.chefProjetId!=chefProjetId){
            throw new ForbiddenException('vous n\'etes pas le proprietaire de ce projet')
        }
        return projet;
    }

    //-------------------modifier un projet--------------
    async modifierProjet(projetId:number,chefProjetId:number,data:ModifierProjetDto){
        await this.verifierProprietaire(projetId,chefProjetId)
        return this.prisma.projet.update({
            where:{id:projetId},
            data: {
      ...(data.nom && { nom: data.nom }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.lienGithub && { liengit: data.lienGithub }),         
      ...(data.technologies && { technologies: data.technologies }),   
    },
        })
    }
    //-------------------------supprimer projet--------------------
    async supprimerProjet(projetId:number,chefProjetId:number){
        await this.verifierProprietaire(projetId,chefProjetId)
        await this.prisma.projet.delete({
            where:{id:projetId},
        })
        return {message:'projet supprimer avec succes'}
    }

    //-------quitter un projet /testeur -------------

    async quitterProjet(projetId,utilisateurId){
        try{
            await this.prisma.projetCollaborateur.delete({
                where:{
                    projetId_utilisateurId:{projetId,utilisateurId,}
                }
            })
            return {message:'vous avez quitter le projet'}
        }catch{
            throw new  NotFoundException("vous n'etes pas collaborateur de ce projet")
        }
    }

    // obtenir projet
    async obtenirProjet(projetId: number, utilisateur: { id: number; role: string }) {
  const projet = await this.prisma.projet.findUnique({
    where: { id: projetId },
    include: { _count: { select: { bugs: true, collaborateurs: true } } },
  });
  if (!projet) throw new NotFoundException('Projet introuvable');

  const estProprietaire = projet.chefProjetId === utilisateur.id;
  const estCollaborateur = await this.prisma.projetCollaborateur.findUnique({
    where: { projetId_utilisateurId: { projetId, utilisateurId: utilisateur.id } },
  });
  if (!estProprietaire && !estCollaborateur) {
    throw new ForbiddenException("Vous n'avez pas accès à ce projet");
  }

  return { ...projet, estProprietaire };
}
}
