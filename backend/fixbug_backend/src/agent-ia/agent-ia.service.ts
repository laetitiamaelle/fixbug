import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { outilsAnalyse, outilConversationTesteur } from './outils';

export type Proposition = { cheminFichier: string; nouveauContenu: string; explication: string };

// agent-ia.service.ts

// Modèles à essayer en priorité QUAND il y a des images à analyser
const MODELES_VISION = [
  'google/gemma-4-31b-it:free',        // vision confirmée, 262K contexte
  'nvidia/nemotron-nano-12b-v2-vl:free', // "VL" = vision-language, dédié à ça
  'dots-studio/dots-3-note-preview:free', // celui qui répondait déjà chez toi
];

// Modèles texte seul — utilisés quand pas d'image, ET en dernier recours si TOUS les modèles vision échouent
const MODELES_TEXTE = [
  'openai/gpt-oss-20b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'z-ai/glm-5.2:free',
  'poolside/laguna-s-2.1:free',
  'dots-studio/dots-3-note-preview:free',
];

@Injectable()
export class AgentIaService {
  private readonly logger = new Logger(AgentIaService.name);
  constructor(private githubService: GithubService) {}

  // --- Appel bas niveau, sur UN modèle précis ---
  // `outils` est soit une liste d'outils (function calling activé),
  // soit `null` (aucun outil — utilisé par genererTitre, qui veut juste du texte).
  private async appelerUnModele(model: string, messages: any[], outils: any[] | null) {
    const reponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, ...(outils ? { tools: outils } : {}) }),
    });
    const donnees = await reponse.json();
    if (!donnees.choices) throw new Error(donnees.error?.message || JSON.stringify(donnees));
    return donnees.choices[0].message;
  }

  
  private async appelerModeleAvecOutils(messages: any[], outils: any[] | null, aDesImages = false) {
  const listeAEssayer = aDesImages ? [...MODELES_VISION, ...MODELES_TEXTE] : MODELES_TEXTE;
  let derniereErreur: Error | null = null;

  for (const model of listeAEssayer) {
    try {
      const message = await this.appelerUnModele(model, messages, outils);
      this.logger.log(`Réponse obtenue via ${model}`);
      return message;
    } catch (e: any) {
      this.logger.warn(`Échec avec ${model} : ${e.message} — tentative suivante`);
      derniereErreur = e;
    }
  }
  throw new BadRequestException(`Tous les modèles ont échoué. Dernière erreur : ${derniereErreur?.message}`);
}

  // --- Génération automatique du titre (aucun outil nécessaire, juste du texte) ---
  async genererTitre(description: string): Promise<string> {
    try {
      const message = await this.appelerModeleAvecOutils(
        [
          { role: 'system', content: 'Tu résumes un rapport de bug en un titre court, factuel, en français. Réponds UNIQUEMENT avec le titre, sans guillemets, maximum 10 mots.' },
          { role: 'user', content: description },
        ],
        null, // pas d'outils pour cette méthode
      );
      const titre = message.content?.trim();
      return titre && titre.length > 0 ? titre : this.titreDeSecours(description);
    } catch {
      return this.titreDeSecours(description);
    }
  }

  private titreDeSecours(description: string): string {
    const texte = description.trim().replace(/\s+/g, ' ');
    return texte.length > 60 ? texte.slice(0, 57) + '...' : texte;
  }

  // --- Analyse d'un bug par le développeur : explore le dépôt, propose des corrections ---
  async analyserBug(lienGithub: string, contexte: string, branche: string, images: string[] = []) {
    const contenuInitial =
      images.length > 0
        ? [
            { type: 'text', text: `${contexte}\n\nJe joins une ou plusieurs captures d'écran du problème. Explore le dépôt si besoin, trouve la cause, puis utilise proposerModification pour chaque fichier à corriger. Termine par un résumé en texte.` },
            ...images.map((url) => ({ type: 'image_url', image_url: { url } })),
          ]
        : `${contexte}\n\nExplore le dépôt si besoin, trouve la cause, puis utilise proposerModification pour chaque fichier à corriger. Termine par un résumé en texte.`;

    const messages: any[] = [{ role: 'user', content: contenuInitial }];
    const propositions: Proposition[] = [];
    let tours = 0;

    while (tours < 8) {
      tours++;
      const messageAssistant = await this.appelerModeleAvecOutils(messages, outilsAnalyse);
      messages.push({ role: 'assistant', content: messageAssistant.content, tool_calls: messageAssistant.tool_calls });

      if (!messageAssistant.tool_calls?.length) {
        return { resumeIA: messageAssistant.content, propositions };
      }

      for (const appel of messageAssistant.tool_calls) {
        const args = JSON.parse(appel.function.arguments);
        let resultat: any;
        try {
          switch (appel.function.name) {
            case 'listerFichiers':
              resultat = await this.githubService.listerFichiers(lienGithub, args.chemin);
              break;
            case 'lireFichier':
              resultat = await this.githubService.lireFichier(lienGithub, args.cheminFichier);
              break;
            case 'proposerModification':
              propositions.push({ cheminFichier: args.cheminFichier, nouveauContenu: args.nouveauContenu, explication: args.explication });
              resultat = { ok: true, message: 'Proposition enregistrée.' };
              break;
            default:
              resultat = { erreur: `Outil inconnu : ${appel.function.name}` };
          }
        } catch (e: any) {
          resultat = { erreur: e.message };
        }
        messages.push({ role: 'tool', tool_call_id: appel.id, content: JSON.stringify(resultat) });
      }
    }
    return { resumeIA: "Je n'ai pas réussi à aboutir à une correction claire pour cette demande.", propositions: [] };
  }
  

  // --- Envoi réel sur GitHub, après validation du développeur (aucun appel IA ici) ---
  async envoyerSurGithub(lienGithub: string, nomBranche: string, propositions: Proposition[], titrePR: string, descriptionPR: string) {
    await this.githubService.creerBranche(lienGithub, nomBranche);
    for (const p of propositions) {
      const { sha } = await this.githubService.lireFichier(lienGithub, p.cheminFichier);
      await this.githubService.modifierFichier(lienGithub, p.cheminFichier, p.nouveauContenu, nomBranche, sha);
    }
    return this.githubService.ouvrirPullRequest(lienGithub, nomBranche, titrePR, descriptionPR);
  }

  // --- Chat conversationnel avec le testeur : répond en texte, ou déclare un bug via l'outil ---
  async discuterAvecTesteur(
    message: string,
    historique: { role: 'user' | 'assistant'; contenu: string }[],
    images: string[] = [],
  ) {
    const messages: any[] = [
      {
        role: 'system',
        content:
          "Tu es l'assistant Fixbug, tu discutes avec un testeur qui signale des anomalies sur une application. Sois bref, chaleureux et concret. Si le testeur décrit un vrai problème technique, utilise l'outil declarerBug. Sinon, réponds normalement et guide-le pour qu'il précise son problème.",
      },
      ...historique.map((h) => ({ role: h.role, content: h.contenu })),
    ];

    const contenuDernierMessage =
      images.length > 0
        ? [{ type: 'text', text: message }, ...images.map((url) => ({ type: 'image_url', image_url: { url } }))]
        : message;
    messages.push({ role: 'user', content: contenuDernierMessage });

    const messageAssistant = await this.appelerModeleAvecOutils(messages, outilConversationTesteur);

    const appelDeclaration = messageAssistant.tool_calls?.find((t: any) => t.function.name === 'declarerBug');
    if (appelDeclaration) {
      const args = JSON.parse(appelDeclaration.function.arguments);
      return { type: 'bug_declare' as const, titre: args.titre, description: args.descriptionReformulee };
    }

    return { type: 'message' as const, contenu: messageAssistant.content ?? "D'accord." };
  }

  // agent-ia.service.ts — remplace envoyerSurGithub par ces deux méthodes
async pousserSurGithub(lienGithub: string, nomBranche: string, propositions: Proposition[]) {
  await this.githubService.creerBranche(lienGithub, nomBranche);
  for (const p of propositions) {
    const { sha } = await this.githubService.lireFichier(lienGithub, p.cheminFichier);
    await this.githubService.modifierFichier(lienGithub, p.cheminFichier, p.nouveauContenu, nomBranche, sha);
  }
  return { nomBranche };
}

async creerPullRequest(lienGithub: string, nomBranche: string, titrePR: string, descriptionPR: string) {
  return this.githubService.ouvrirPullRequest(lienGithub, nomBranche, titrePR, descriptionPR);
}
}