import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { outilsAnalyse } from './outils';

export type Proposition = { cheminFichier: string; nouveauContenu: string; explication: string };

const MODELES = [
    'google/gemma-4-26b-a4b-it:free',
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'dots-studio/dots-3-note-preview:free',
    'openai/gpt-oss-20b:free',
];

@Injectable()
export class AgentIaService {
    private readonly logger = new Logger(AgentIaService.name);
    constructor(private githubService: GithubService) { }

    // Appel bas niveau, sur UN modèle précis
    private async appelerUnModele(model: string, messages: any[], avecOutils: boolean) {
        const reponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, ...(avecOutils ? { tools: outilsAnalyse } : {}) }),
        });
        const donnees = await reponse.json();
        if (!donnees.choices) {
            throw new Error(donnees.error?.message || JSON.stringify(donnees));
        }
        return donnees.choices[0].message;
    }

    // NOUVEAU : essaie chaque modèle de la liste jusqu'à ce qu'un réponde
    private async appelerModele(messages: any[], avecOutils = true) {
        let derniereErreur: Error | null = null;
        for (const model of MODELES) {
            try {
                const message = await this.appelerUnModele(model, messages, avecOutils);
                this.logger.log(`Réponse obtenue via ${model}`);
                return message;
            } catch (e: any) {
                this.logger.warn(`Échec avec ${model} : ${e.message} — tentative suivante`);
                derniereErreur = e;
            }
        }
        throw new BadRequestException(`Tous les modèles ont échoué. Dernière erreur : ${derniereErreur?.message}`);
    }

    // Pour un simple appel texte sans outils ex: genererTitre
    private async appelerModeleSimple(messages: any[]) {
        return this.appelerModele(messages, false);
    }

    async genererTitre(description: string): Promise<string> {
        try {
            const message = await this.appelerModeleSimple([
                { role: 'system', content: 'Tu résumes un rapport de bug en un titre court, factuel, en français. Réponds UNIQUEMENT avec le titre, sans guillemets, maximum 10 mots.' },
                { role: 'user', content: description },
            ]);
            const titre = message.content?.trim();
            return titre?.length > 0 ? titre : this.titreDeSecours(description);
        } catch {
            return this.titreDeSecours(description);
        }
    }

    private titreDeSecours(description: string): string {
        const texte = description.trim().replace(/\s+/g, ' ');
        return texte.length > 60 ? texte.slice(0, 57) + '...' : texte;
    }

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
                        case 'listerFichiers': resultat = await this.githubService.listerFichiers(lienGithub, args.chemin); break;
                        case 'lireFichier': resultat = await this.githubService.lireFichier(lienGithub, args.cheminFichier); break;
                        case 'proposerModification':
                            propositions.push({ cheminFichier: args.cheminFichier, nouveauContenu: args.nouveauContenu, explication: args.explication });
                            resultat = { ok: true, message: 'Proposition enregistrée.' };
                            break;
                        default: resultat = { erreur: `Outil inconnu : ${appel.function.name}` };
                    }
                } catch (e: any) {
                    resultat = { erreur: e.message };
                }
                messages.push({ role: 'tool', tool_call_id: appel.id, content: JSON.stringify(resultat) });
            }
        }
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