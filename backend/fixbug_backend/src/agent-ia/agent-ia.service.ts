import { Injectable, Logger } from '@nestjs/common';
import { IaProviderService } from './ia-provider/ia-provider.service';
import { GithubService } from '../github/github.service';
import { outilsAnalyse, outilConversationTesteur } from './outils';

export type Proposition = { cheminFichier: string; nouveauContenu: string; explication: string; estNouveauFichier?: boolean };
export type FichierProjet = { chemin: string; contenu: string };

// Filtre backend, en miroir du filtre frontend — sécurité en cas d'oubli côté client
const FICHIERS_EXCLUS = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'];
const DOSSIERS_EXCLUS = ['node_modules/', '.next/', 'dist/', 'build/', '.git/'];
const EXTENSIONS_EXCLUES = ['.svg', '.png', '.jpg', '.jpeg', '.ico', '.woff', '.woff2', '.map'];
const TAILLE_MAX_PAR_FICHIER = 30_000;
const BUDGET_TOTAL = 150_000;

function filtrerFichiers(fichiers: FichierProjet[]): FichierProjet[] {
  let candidats = fichiers
    .filter((f) => !FICHIERS_EXCLUS.includes(f.chemin.split('/').pop() ?? ''))
    .filter((f) => !DOSSIERS_EXCLUS.some((d) => f.chemin.includes(d)))
    .filter((f) => !EXTENSIONS_EXCLUES.some((ext) => f.chemin.endsWith(ext)))
    .filter((f) => f.contenu.length <= TAILLE_MAX_PAR_FICHIER);

  candidats.sort((a, b) => a.contenu.length - b.contenu.length);
  let total = 0;
  const resultat: FichierProjet[] = [];
  for (const f of candidats) {
    if (total + f.contenu.length > BUDGET_TOTAL) break;
    resultat.push(f);
    total += f.contenu.length;
  }
  return resultat;
}

@Injectable()
export class AgentIaService {
  private readonly logger = new Logger(AgentIaService.name);
  constructor(private iaProviderService: IaProviderService, private githubService: GithubService) {}

  private async appelerModeleAvecOutils(messages: any[], outils: any[] | null, aDesImages = false) {
    return this.iaProviderService.appelerAvecFallback(messages, outils, aDesImages);
  }

  async genererTitre(description: string): Promise<string> {
    try {
      const message = await this.appelerModeleAvecOutils(
        [
          { role: 'system', content: 'Tu résumes un rapport de bug en un titre court, factuel, en français. Réponds UNIQUEMENT avec le titre, sans guillemets, maximum 10 mots.' },
          { role: 'user', content: description },
        ],
        null,
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

  async analyserBug(contexte: string, fichiers: FichierProjet[], images: string[] = []) {
    const fichiersFiltres = filtrerFichiers(fichiers);
    const codeProjet = fichiersFiltres.map((f) => `--- ${f.chemin} ---\n${f.contenu}`).join('\n\n');

    const instruction =
      `${contexte}\n\n` +
      `Voici l'état actuel des fichiers du projet (${fichiersFiltres.length} fichiers, certains fichiers volumineux/générés ont été exclus) :\n\n` +
      `${codeProjet}\n\n` +
      `Analyse le bug à partir de ce code. Identifie la cause.\n` +
      `Utilise proposerModification pour corriger un fichier EXISTANT, ou creerFichier si un fichier manque.\n` +
      `Ne cherche pas à accéder à GitHub. Ne modifie rien directement. Termine par un résumé clair.`;

    const contenuInitial = images.length > 0
      ? [{ type: 'text', text: instruction }, ...images.map((url) => ({ type: 'image_url', image_url: { url } }))]
      : instruction;

    const messages: any[] = [{ role: 'user', content: contenuInitial }];
    const propositions: Proposition[] = [];
    let tours = 0;
    let relanceTentee = false;

    while (tours < 10) {
      tours++;
      const messageAssistant = await this.appelerModeleAvecOutils(messages, outilsAnalyse, images.length > 0);
      messages.push({ role: 'assistant', content: messageAssistant.content, tool_calls: messageAssistant.tool_calls });

      if (!messageAssistant.tool_calls?.length) {
        if (propositions.length === 0 && !relanceTentee) {
          relanceTentee = true;
          messages.push({
            role: 'user',
            content: "Tu dois maintenant conclure : appelle proposerModification ou creerFichier avec le contenu corrigé complet, ou explique clairement pourquoi aucune correction n'est possible.",
          });
          continue;
        }
        return { resumeIA: messageAssistant.content, propositions };
      }

      for (const appel of messageAssistant.tool_calls) {
        const args = JSON.parse(appel.function.arguments);
        let resultat: any;
        try {
          switch (appel.function.name) {
            case 'proposerModification':
              propositions.push({ cheminFichier: args.cheminFichier, nouveauContenu: args.nouveauContenu, explication: args.explication, estNouveauFichier: false });
              resultat = { ok: true, message: 'Proposition enregistrée.' };
              break;
            case 'creerFichier':
              propositions.push({ cheminFichier: args.cheminFichier, nouveauContenu: args.contenu, explication: args.explication, estNouveauFichier: true });
              resultat = { ok: true, message: 'Création de fichier enregistrée.' };
              break;
            default:
              resultat = { erreur: `Outil inconnu : ${appel.function.name}` };
          }
        } catch (e: any) {
          resultat = { erreur: e.message };
        }
        messages.push({ role: 'tool', tool_call_id: appel.id, name: appel.function.name, content: JSON.stringify(resultat) });
      }
    }
    return { resumeIA: "Je n'ai pas réussi à aboutir à une correction claire pour cette demande.", propositions: [] };
  }

  /**
   * ANCIEN flux de push (fichier par fichier). Conservé au cas où, mais N'EST PLUS
   * utilisé par pousserSurGithub côté BugsService — remplacé par pousserTousLesFichiers,
   * qui pousse l'état complet du WebContainer en un commit atomique (cf. github.service.ts).
   */
  async pousserSurGithub(lienGithub: string, nomBranche: string, propositions: Proposition[]) {
    await this.githubService.creerBranche(lienGithub, nomBranche);
    for (const p of propositions) {
      let sha: string | undefined;
      if (!p.estNouveauFichier) {
        try {
          const lecture = await this.githubService.lireFichier(lienGithub, p.cheminFichier, nomBranche);
          sha = lecture.sha;
        } catch {
          // fichier inexistant côté GitHub non plus — traité comme une création
        }
      }
      await this.githubService.modifierFichier(lienGithub, p.cheminFichier, p.nouveauContenu, nomBranche, sha as any);
    }
    return { nomBranche };
  }

  /**
   * NOUVEAU : pousse l'état COMPLET du WebContainer (tous les fichiers actuels,
   * édités par le développeur ou par l'IA) en un seul commit atomique.
   */
  async pousserTousLesFichiers(lienGithub: string, nomBranche: string, fichiers: FichierProjet[]) {
    return this.githubService.pousserTousLesFichiers(lienGithub, nomBranche, fichiers);
  }

  async creerPullRequest(lienGithub: string, nomBranche: string, titrePR: string, descriptionPR: string) {
    return this.githubService.ouvrirPullRequest(lienGithub, nomBranche, titrePR, descriptionPR);
  }

  async discuterAvecTesteur(message: string, historique: { role: 'user' | 'assistant'; contenu: string }[], images: string[] = []) {
    const messages: any[] = [
      { role: 'system', content: "Tu es l'assistant Fixbug, tu discutes avec un testeur qui signale des anomalies. Sois bref, chaleureux et concret. Si le testeur décrit un vrai problème technique, utilise l'outil declarerBug. Sinon, réponds normalement." },
      ...historique.map((h) => ({ role: h.role, content: h.contenu })),
    ];
    const contenuDernierMessage = images.length > 0
      ? [{ type: 'text', text: message }, ...images.map((url) => ({ type: 'image_url', image_url: { url } }))]
      : message;
    messages.push({ role: 'user', content: contenuDernierMessage });

    const messageAssistant = await this.appelerModeleAvecOutils(messages, outilConversationTesteur, images.length > 0);
    const appelDeclaration = messageAssistant.tool_calls?.find((t: any) => t.function.name === 'declarerBug');
    if (appelDeclaration) {
      const args = JSON.parse(appelDeclaration.function.arguments);
      return { type: 'bug_declare' as const, titre: args.titre, description: args.descriptionReformulee };
    }
    return { type: 'message' as const, contenu: messageAssistant.content ?? "D'accord." };
  }
}
