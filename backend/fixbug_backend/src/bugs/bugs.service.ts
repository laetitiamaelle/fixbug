import { Injectable, ForbiddenException, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { DeclarerBugDto } from './DTO/declarer-bug.dto';
import { GithubService } from 'src/github/github.service';
import { AgentIaService } from 'src/agent-ia/agent-ia.service';
import { Proposition } from '../agent-ia/agent-ia.service';
@Injectable()
export class BugsService {
  private readonly logger = new Logger(BugsService.name);
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
    private githubService: GithubService,
    private agentIaService: AgentIaService,
  ) { }

  async declarerBug(utilisateurId: number, dto: DeclarerBugDto, fichiers: Express.Multer.File[]) {
    const projet = await this.prisma.projet.findUnique({ where: { id: dto.projetId } });
    if (!projet) throw new NotFoundException('Projet introuvable');

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
      include: {
        testeur: { select: { id: true, nom: true, prenom: true } },
        developpeur: { select: { id: true, nom: true, prenom: true } },
        projet: { select: { nom: true } }
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  //---------------------prendre en charge un bug------------------------------------

  async prendreEnCharge(bugId: number, developpeurId: number) {
    const resultat = await this.prisma.bug.updateMany({
      where: { id: bugId, developpeurId: null },
      data: { developpeurId },
    });

    if (resultat.count === 0) {
      throw new ConflictException('Ce bug a déjà été pris en charge par un autre développeur');
    }

    const bug = await this.prisma.bug.findUnique({
      where: { id: bugId },
      include: { projet: true, developpeur: { select: { nom: true, prenom: true } } },
    });


    if (!bug) {
      throw new NotFoundException(`Le bug avec l'ID ${bugId} est introuvable`);
    }


    await this.notificationsService.creerNotifications(
      bug.projet.chefProjetId,
      'Bug pris en charge',
      `${bug.developpeur?.nom} ${bug.developpeur?.prenom} a pris en charge un bug sur "${bug.projet.nom}"`,
    );

    return bug;
  }

  //-------- obtenir les fichiers d'un projets sur github -------

  async obtenirFichiersDuBug(bugId: number, developpeurId: number) {
    const bug = await this.prisma.bug.findUnique({
      where: { id: bugId },
      include: { projet: true },
    });
    if (!bug) throw new NotFoundException('Bug introuvable');

    // Seul le développeur qui a pris en charge CE bug précis peut voir le code
    if (bug.developpeurId !== developpeurId) {
      throw new ForbiddenException("Vous n'avez pas pris en charge ce bug");
    }
    if (!bug.projet.liengit) {
      throw new BadRequestException("Ce projet n'a pas de dépôt GitHub configuré");
    }

    return this.githubService.obtenirArborescenceComplete(bug.projet.liengit);
  }
  // bugs.service.ts — dans demanderAnalyseIA
  async demanderAnalyseIA(bugId: number, developpeurId: number, instructionDeveloppeur?: string) {
    const bug = await this.prisma.bug.findUnique({ where: { id: bugId }, include: { projet: true } });
    if (!bug) throw new NotFoundException('Bug introuvable');
    if (bug.developpeurId !== developpeurId) throw new ForbiddenException("Ce bug ne vous est pas assigné");

    const contexte = instructionDeveloppeur ? `Bug initial : ${bug.description}\n\nInstruction : ${instructionDeveloppeur}` : bug.description;
    const { resumeIA, propositions } = await this.agentIaService.analyserBug(bug.projet.liengit, contexte, 'main'); // ← 'main' au lieu de bug.projet.branchePrincipale

    return this.prisma.bug.update({
      where: { id: bugId },
      data: {
        proposition: JSON.stringify({ resumeIA, propositions }),
        statut: propositions.length > 0 ? 'EN_ATTENTE_VALIDATION' : 'BLOQUE',
      },
    });
  }

  async validerEtEnvoyer(bugId: number, developpeurId: number, propositions: Proposition[]) {
    const bug = await this.prisma.bug.findUnique({ where: { id: bugId }, include: { projet: true } });
    if (!bug) throw new NotFoundException('Bug introuvable');
    if (bug.developpeurId !== developpeurId) throw new ForbiddenException("Ce bug ne vous est pas assigné");

    const nomBranche = `fix/bug-${bug.id}`;
    const pr = await this.agentIaService.envoyerSurGithub(bug.projet.liengit, nomBranche, propositions, `Fix bug #${bug.id}`, bug.description);

    const bugMisAJour = await this.prisma.bug.update({ where: { id: bugId }, data: { statut: 'RESOLU', numeroPR: pr.numero, urlPR: pr.url } });
    await this.notificationsService.creerNotifications(bug.projet.chefProjetId, 'Pull Request créée', `PR #${pr.numero} créée pour le bug #${bug.id}`);
    return bugMisAJour;
  }
}

