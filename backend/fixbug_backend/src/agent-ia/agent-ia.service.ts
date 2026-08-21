import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { outilsAnalyse } from './outils';

export type Proposition = { cheminFichier: string; nouveauContenu: string; explication: string };

@Injectable()
export class AgentIaService {
  private readonly logger = new Logger(AgentIaService.name);
  constructor(private githubService: GithubService) {}

  private async appelerModele(messages: any[]) {
    const reponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openrouter/free', messages, tools: outilsAnalyse }),
    });
    const donnees = await reponse.json();
    if (!donnees.choices) throw new BadRequestException(`Erreur OpenRouter : ${JSON.stringify(donnees)}`);
    return donnees.choices[0].message;
  }

  async analyserBug(lienGithub: string, contexte: string, branche: string) {
    const messages: any[] = [
      { role: 'user', content: `${contexte}\n\nExplore le dépôt si besoin, trouve la cause, puis utilise proposerModification pour chaque fichier à corriger. Termine par un résumé en texte.` },
    ];
    const propositions: Proposition[] = [];
    let tours = 0;

    while (tours < 8) {
      tours++;
      const messageAssistant = await this.appelerModele(messages);
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
    // Aucune conclusion après 8 tours : pas une exception, un résultat "bloqué" pour rester cohérent avec le chat
    return { resumeIA: "Je n'ai pas réussi à aboutir à une correction claire pour cette demande.", propositions: [] };
  }

  async envoyerSurGithub(lienGithub: string, nomBranche: string, propositions: Proposition[], titrePR: string, descriptionPR: string) {
    await this.githubService.creerBranche(lienGithub, nomBranche);
    for (const p of propositions) {
      const { sha } = await this.githubService.lireFichier(lienGithub, p.cheminFichier);
      await this.githubService.modifierFichier(lienGithub, p.cheminFichier, p.nouveauContenu, nomBranche, sha);
    }
    return this.githubService.ouvrirPullRequest(lienGithub, nomBranche, titrePR, descriptionPR);
  }
}