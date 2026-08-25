// conversations/conversations.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AgentIaService } from 'src/agent-ia/agent-ia.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { NotificationsService } from 'src/notifications/notifications.service';

type MessageStocke = {
  role: 'user' | 'assistant';
  contenu: string;
  captures?: string[];
  bugId?: number;
  bugTitre?: string;
  bugStatut?: string;
  createdAt: string;
};

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private agentIaService: AgentIaService,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
  ) {}

  // --- Créer une conversation vide (bouton "Nouveau chat") ---
  async creerConversation(testeurId: number, projetId: number) {
    const projet = await this.prisma.projet.findUnique({ where: { id: projetId } });
    if (!projet) throw new NotFoundException('Projet introuvable');

    return this.prisma.conversation.create({
      data: { projetId, testeurId, messages: [] },
    });
  }

  // --- Lister les conversations du testeur sur un projet (pour la sidebar, façon ChatGPT) ---
  async listerConversations(testeurId: number, projetId: number) {
    return this.prisma.conversation.findMany({
      where: { testeurId, projetId },
      select: { id: true, titre: true, updatedAt: true, createdAt: true }, // pas besoin des messages ici, juste la liste
      orderBy: { updatedAt: 'desc' }, // la plus récente en haut, comme sur ChatGPT/Claude
    });
  }

  // --- Charger une conversation précise, avec tous ses messages ---
  async obtenirConversation(testeurId: number, conversationId: number) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation introuvable');
    if (conv.testeurId !== testeurId) throw new ForbiddenException("Cette conversation ne vous appartient pas");
    return conv;
  }

  // --- Envoyer un message dans une conversation existante ---
  async envoyerMessage(
    testeurId: number,
    conversationId: number,
    texte: string,
    fichiers: Express.Multer.File[],
  ) {
    const conv = await this.obtenirConversation(testeurId, conversationId);
    const messagesActuels = (conv.messages as MessageStocke[]) ?? [];

    const captures = fichiers?.length ? await this.cloudinaryService.uploaderPlusieursImages(fichiers) : [];

    // Message utilisateur, ajouté à l'historique stocké
    const messageUtilisateur: MessageStocke = {
      role: 'user',
      contenu: texte,
      captures,
      createdAt: new Date().toISOString(),
    };

    // Historique donné à l'IA : format simplifié (role + contenu texte uniquement)
    const historiquePourIA = messagesActuels.map((m) => ({ role: m.role, contenu: m.contenu }));
    const resultatIA = await this.agentIaService.discuterAvecTesteur(texte, historiquePourIA, captures);

    let messageAssistant: MessageStocke;

    if (resultatIA.type === 'bug_declare') {
      // Un vrai bug est créé, exactement comme avant
      const projet = await this.prisma.projet.findUnique({ where: { id: conv.projetId } });
      const bug = await this.prisma.bug.create({
        data: { titre: resultatIA.titre, description: resultatIA.description, captures, projetId: conv.projetId, testeurId },
        include: { testeur: { select: { nom: true, prenom: true } } },
      });

      if (projet && projet.chefProjetId !== testeurId) {
        await this.notificationsService.creerNotifications(
          projet.chefProjetId,
          'Nouveau bug déclaré',
          `Un nouveau bug a été signalé sur le projet "${projet.nom}"`,
        );
      }

      messageAssistant = {
        role: 'assistant',
        contenu: `J'ai bien enregistré votre signalement : « ${bug.titre} ». Un développeur va s'en occuper.`,
        bugId: bug.id,
        bugTitre: bug.titre ?? undefined,
        bugStatut: bug.statut,
        createdAt: new Date().toISOString(),
      };
    } else {
      messageAssistant = { role: 'assistant', contenu: resultatIA.contenu, createdAt: new Date().toISOString() };
    }

    const nouveauxMessages = [...messagesActuels, messageUtilisateur, messageAssistant];

    // titre auto de la conversation, généré 
    const titre = conv.titre ?? (await this.agentIaService.genererTitre(texte));

    const convMiseAJour = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { messages: nouveauxMessages, titre },
    });

    return convMiseAJour;
  }
}