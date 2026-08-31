
import { Injectable, Logger } from '@nestjs/common';

import { IaProviderService } from './ia-provider/ia-provider.service';

import { GithubService } from '../github/github.service';

import {
  outilsAnalyse,
  outilConversationTesteur,
} from './outils';


/**
 * Une proposition représente une modification suggérée
 * par l'agent IA.
 *
 * IMPORTANT :
 * L'IA ne modifie pas directement le projet.
 *
 * Elle renvoie simplement cette proposition au frontend.
 *
 * Le développeur pourra ensuite :
 * - accepter la modification ;
 * - ou la refuser.
 */
export type Proposition = {
  cheminFichier: string;
  nouveauContenu: string;
  explication: string;
};


/**
 * Représente un fichier présent dans le WebContainer.
 *
 * Le frontend récupérera ces fichiers depuis le WebContainer
 * et les enverra au backend lorsqu'il demandera une analyse.
 */
export type FichierProjet = {
  chemin: string;
  contenu: string;
};


@Injectable()
export class AgentIaService {

  private readonly logger = new Logger(AgentIaService.name);


  constructor(
    /**
     * Service permettant d'appeler le fournisseur IA.
     *
     * Pour le moment :
     * OpenRouter.
     *
     * Plus tard :
     * Gemini / Mistral / Grok...
     */
    private iaProviderService: IaProviderService,

    /**
     * GithubService reste nécessaire.
     *
     * MAIS il n'est plus utilisé pour analyser le projet.
     *
     * Il sera utilisé plus tard pour :
     * - créer la branche ;
     * - pousser les fichiers ;
     * - créer la Pull Request.
     */
    private githubService: GithubService,
  ) { }


  // ============================================================
  // APPEL DU FOURNISSEUR IA
  // ============================================================

  /**
   * Méthode commune permettant d'appeler l'IA.
   *
   * On utilise actuellement OpenRouter.
   *
   * Le paramètre aDesImages permet à IaProviderService
   * de choisir entre ses modèles vision et ses modèles texte.
   */
  private async appelerModeleAvecOutils(messages: any[], outils: any[] | null, aDesImages = false) {
    return this.iaProviderService.appelerAvecFallback(messages, outils, aDesImages); // CHANGÉ (était 'openrouter' fixe)
  }


  // ============================================================
  // GENERATION DU TITRE D'UN BUG
  // ============================================================

  /**
   * Génère automatiquement un titre court à partir
   * de la description du bug.
   *
   * Cette méthode ne change pas.
   */
  async genererTitre(description: string): Promise<string> {

    try {

      const message = await this.appelerModeleAvecOutils(
        [
          {
            role: 'system',
            content:
              'Tu résumes un rapport de bug en un titre court, ' +
              'factuel, en français. Réponds UNIQUEMENT avec le titre, ' +
              'sans guillemets, maximum 10 mots.',
          },

          {
            role: 'user',
            content: description,
          },
        ],

        /**
         * Pas besoin d'outil ici.
         */
        null,
      );


      const titre = message.content?.trim();


      return titre && titre.length > 0
        ? titre
        : this.titreDeSecours(description);

    } catch {

      /**
       * Si l'IA ne répond pas, on utilise un titre de secours.
       */
      return this.titreDeSecours(description);
    }
  }


  /**
   * Génère un titre de secours lorsque l'IA échoue.
   */
  private titreDeSecours(description: string): string {

    const texte = description
      .trim()
      .replace(/\s+/g, ' ');


    return texte.length > 60
      ? texte.slice(0, 57) + '...'
      : texte;
  }



  async analyserBug(lienGithub: string, contexte: string, branche: string, images: string[] = []) {
    const instruction =
      `${contexte}\n\nExplore le dépôt via listerFichiers et lireFichier pour identifier la cause du problème. ` +
      `N'appelle lireFichier QUE sur les fichiers dont tu as de bonnes raisons de penser qu'ils sont concernés — ` +
      `ne lis pas le projet en entier. Une fois la cause trouvée, utilise proposerModification pour chaque fichier ` +
      `à corriger. Termine par un résumé clair de ton analyse.`;

    const contenuInitial = images.length > 0
      ? [{ type: 'text', text: instruction }, ...images.map((url) => ({ type: 'image_url', image_url: { url } }))]
      : instruction;

    const messages: any[] = [{ role: 'user', content: contenuInitial }];
    const propositions: Proposition[] = [];
    let tours = 0;

    while (tours < 8) {
      tours++;
      const messageAssistant = await this.appelerModeleAvecOutils(messages, outilsAnalyse, images.length > 0);
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
        messages.push({
          role: 'tool',
          tool_call_id: appel.id,
          name: appel.function.name,
          content: JSON.stringify(resultat),
        });
      }
    }
    return { resumeIA: "Je n'ai pas réussi à aboutir à une correction claire pour cette demande.", propositions: [] };
  }


  // ============================================================
  // PUSH SUR GITHUB
  // ============================================================

  /**
   * Cette méthode reste côté Github.
   *
   * Elle sera utilisée lorsque le développeur décidera
   * de pousser son travail.
   *
   * IMPORTANT :
   * Ce n'est PAS l'IA qui appelle cette méthode.
   */
  async pousserSurGithub(
    lienGithub: string,
    nomBranche: string,
    propositions: Proposition[],
  ) {

    /**
     * Création de la branche de correction.
     */
    await this.githubService.creerBranche(
      lienGithub,
      nomBranche,
    );


    /**
     * Pour chaque proposition acceptée,
     * on récupère le SHA actuel du fichier puis
     * on envoie son nouveau contenu sur GitHub.
     *
     * Cette méthode sera ensuite adaptée pour recevoir
     * l'état réel du WebContainer, afin de prendre également
     * en compte les modifications manuelles du développeur.
     */
    for (const p of propositions) {

      const { sha } =
        await this.githubService.lireFichier(
          lienGithub,
          p.cheminFichier,
        );


      await this.githubService.modifierFichier(
        lienGithub,
        p.cheminFichier,
        p.nouveauContenu,
        nomBranche,
        sha,
      );
    }


    return {
      nomBranche,
    };
  }


  // ============================================================
  // CREATION D'UNE PULL REQUEST
  // ============================================================

  /**
   * Création de la Pull Request.
   *
   * Cette action est déclenchée par le développeur,
   * jamais automatiquement par l'IA.
   */
  async creerPullRequest(
    lienGithub: string,
    nomBranche: string,
    titrePR: string,
    descriptionPR: string,
  ) {

    return this.githubService.ouvrirPullRequest(
      lienGithub,
      nomBranche,
      titrePR,
      descriptionPR,
    );
  }


  // ============================================================
  // CONVERSATION AVEC LE TESTEUR
  // ============================================================

  /**
   * Conversation entre le testeur et l'assistant IA.
   *
   * Cette fonctionnalité existante reste inchangée.
   */
  async discuterAvecTesteur(
    message: string,
    historique: {
      role: 'user' | 'assistant';
      contenu: string;
    }[],
    images: string[] = [],
  ) {

    const messages: any[] = [

      {
        role: 'system',

        content:
          "Tu es l'assistant Fixbug, tu discutes avec un testeur " +
          "qui signale des anomalies sur une application. " +
          "Sois bref, chaleureux et concret. " +
          "Si le testeur décrit un vrai problème technique, " +
          "utilise l'outil declarerBug. " +
          "Sinon, réponds normalement et guide-le pour qu'il " +
          "précise son problème.",
      },


      /**
       * Historique de la conversation.
       */
      ...historique.map(
        (h) => ({
          role: h.role,
          content: h.contenu,
        }),
      ),
    ];


    /**
     * Message actuel du testeur.
     *
     * Peut contenir :
     * - du texte ;
     * - des images.
     */
    const contenuDernierMessage =
      images.length > 0

        ? [
          {
            type: 'text',
            text: message,
          },

          ...images.map(
            (url) => ({
              type: 'image_url',
              image_url: {
                url,
              },
            }),
          ),
        ]

        : message;


    messages.push({
      role: 'user',
      content: contenuDernierMessage,
    });


    /**
     * Appel de l'IA avec l'outil declarerBug.
     */
    const messageAssistant =
      await this.appelerModeleAvecOutils(
        messages,
        outilConversationTesteur,
        images.length > 0,
      );


    /**
     * Vérifie si l'IA a décidé de déclarer
     * réellement un bug.
     */
    const appelDeclaration =
      messageAssistant.tool_calls?.find(
        (t: any) =>
          t.function.name === 'declarerBug',
      );


    if (appelDeclaration) {

      const args =
        JSON.parse(
          appelDeclaration.function.arguments,
        );


      return {
        type: 'bug_declare' as const,

        titre: args.titre,

        description:
          args.descriptionReformulee,
      };
    }


    /**
     * Sinon on retourne une réponse normale.
     */
    return {
      type: 'message' as const,

      contenu:
        messageAssistant.content ??
        "D'accord.",
    };
  }
}

