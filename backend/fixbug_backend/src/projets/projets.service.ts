import { ForbiddenException, Injectable, NotFoundException,Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreerProjetDto } from './DTO/creer-projet.dto';
import { NotFoundError } from 'rxjs';
import { ModifierProjetDto } from './DTO/modifier-projet.dto';

@Injectable()

export class ProjetsService {
     private readonly logger = new Logger(ProjetsService.name);
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

async obtenirStatistiques(chefProjetId: number) {
  const projets = await this.prisma.projet.findMany({
    where: { chefProjetId },
    select: { id: true },
  });
  const projetIds = projets.map((p) => p.id);

  const [collaborateurs, bugsParStatut] = await Promise.all([
    // NOUVEAU : distinct évite de compter plusieurs fois le même testeur
    // s'il collabore sur plusieurs de tes projets
    this.prisma.projetCollaborateur.findMany({
      where: { projetId: { in: projetIds } },
      select: { utilisateurId: true },
      distinct: ['utilisateurId'],
    }),
    // NOUVEAU : groupBy fait le comptage par statut directement en base,
    // plus rapide que de tout récupérer et compter côté Node
    this.prisma.bug.groupBy({
      by: ['statut'],
      where: { projetId: { in: projetIds } },
      _count: true,
    }),
  ]);

  const compteur = { EN_COURS_DE_TRAITEMENT: 0, EN_ATTENTE_VALIDATION: 0, BLOQUE: 0, RESOLU: 0 };
  bugsParStatut.forEach((b) => { compteur[b.statut] = b._count; });

  return {
    nombreProjets: projetIds.length,
    nombreCollaborateurs: collaborateurs.length,
    nombreBugs: Object.values(compteur).reduce((a, b) => a + b, 0),
    bugsCorriges: compteur.RESOLU,
    bugsEnAttente: compteur.EN_ATTENTE_VALIDATION,
    bugsNonCorriges: compteur.EN_COURS_DE_TRAITEMENT + compteur.BLOQUE,
  };
}

// stats chef projet pour un projet 

// projets.service.ts — nouvelle méthode
async obtenirApercu(projetId: number) {
  const projet = await this.prisma.projet.findUnique({ where: { id: projetId } });
  if (!projet) throw new NotFoundException('Projet introuvable');

  // Membres = collaborations acceptées, avec le rôle de chaque utilisateur
  const collaborations = await this.prisma.projetCollaborateur.findMany({
    where: { projetId, statutInvitation: 'ACCEPTEE' },
    include: { utilisateur: { select: { role: true } } },
  });

  const nombreTesteurs = collaborations.filter((c) => c.utilisateur.role === 'TESTEUR').length;
  const nombreDeveloppeurs = collaborations.filter((c) => c.utilisateur.role === 'DEVELOPPEUR').length;
  const nombreMembres = collaborations.length + 1; // +1 pour le chef de projet lui-même

  // Bugs regroupés par statut, en une seule requête agrégée (pas 4 requêtes séparées)
  const bugsParStatut = await this.prisma.bug.groupBy({
    by: ['statut'],
    where: { projetId },
    _count: { _all: true },
  });

  const compteur = (statut: string) =>
    bugsParStatut.find((b) => b.statut === statut)?._count._all ?? 0;

  const enCoursDeTraitement = compteur('EN_COURS_DE_TRAITEMENT');
  const enAttenteValidation = compteur('EN_ATTENTE_VALIDATION');
  const bloque = compteur('BLOQUE');
  const resolu = compteur('RESOLU');

  return {
    nombreMembres,
    nombreTesteurs,
    nombreDeveloppeurs,
    bugs: {
      total: enCoursDeTraitement + enAttenteValidation + bloque + resolu,
      enCoursDeTraitement,
      enAttenteValidation,
      bloque,
      resolu,
    },
  };
}
}
