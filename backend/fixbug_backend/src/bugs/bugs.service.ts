import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { DeclarerBugDto } from './DTO/declarer-bug.dto';

@Injectable()
export class BugsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
  ) {}

 async declarerBug(utilisateurId: number, dto: DeclarerBugDto, fichiers: Express.Multer.File[]) {
  const projet = await this.prisma.projet.findUnique({ where: { id: dto.projetId } });
  if (!projet) throw new NotFoundException('Projet introuvable');

  // CORRIGÉ : on vérifie maintenant soit que c'est le propriétaire (Chef de projet),
  // soit un collaborateur (Testeur) — plus seulement collaborateur.
  const estProprietaire = projet.chefProjetId === utilisateurId;
  const estCollaborateur = await this.prisma.projetCollaborateur.findUnique({
    where: { projetId_utilisateurId: { projetId: dto.projetId, utilisateurId } },
  });

  if (!estProprietaire && !estCollaborateur) {
    throw new ForbiddenException("Vous n'avez pas accès à ce projet");
  }

  const captures = fichiers?.length ? await this.cloudinaryService.uploaderPlusieursImages(fichiers) : [];

  const bug = await this.prisma.bug.create({
    data: { titre: dto.titre, description: dto.description, captures, projetId: dto.projetId, testeurId: utilisateurId },
    include: { testeur: { select: { nom: true, prenom: true } } },
  });

 
  if (!estProprietaire) {
    await this.notificationsService.creerNotifications(
      projet.chefProjetId,
      'Nouveau bug déclaré',
      `Un nouveau bug a été signalé sur le projet "${projet.nom}"`,
    );
  }

  return bug;
}

  async listerBugs(utilisateur: { id: number; role: string }, projetId?: number) {
    const filtreProjet =
      utilisateur.role === 'CHEF_PROJET'
        ? { chefProjetId: utilisateur.id }
        : { collaborateurs: { some: { utilisateurId: utilisateur.id } } };

    return this.prisma.bug.findMany({
      where: { projet: filtreProjet, ...(projetId ? { projetId } : {}) },
      include: { testeur: { select: { id: true, nom: true, prenom: true } }, projet: { select: { nom: true } } },
      orderBy: { createdAt: 'asc' }, 
    });
  }
}