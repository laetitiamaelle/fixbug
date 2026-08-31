import { Injectable, BadRequestException ,Logger} from '@nestjs/common';
import { Octokit } from 'octokit';

@Injectable()
export class GithubService {
     private readonly logger = new Logger(GithubService.name);
    private octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    //  extrait "owner" et "repo" depuis un lien complet
    // Exemple : "https://github.com/laetitiamaelle/fixbug" → { owner: "laetitiamaelle", repo: "fixbug" }
    private extraireOwnerRepo(lienGithub: string): { owner: string; repo: string } {
  if (!lienGithub) {
    throw new BadRequestException('Le lien GitHub est requis');
  }
  const correspondance = lienGithub.match(/github\.com\/([^/]+)\/([^/]+?)(\.git)?\/?$/);
  if (!correspondance) {
    throw new BadRequestException('Lien GitHub invalide');
  }
  return { owner: correspondance[1], repo: correspondance[2] };
}

    async listerFichiers(lienGithub: string, chemin = '') {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);
        const reponse = await this.octokit.rest.repos.getContent({ owner, repo, path: chemin });
        // getContent renvoie soit un tableau (dossier), soit un objet unique (fichier)
        if (!Array.isArray(reponse.data)) return [];
        return reponse.data.map((f) => ({ nom: f.name, type: f.type, chemin: f.path }));
    }

    // CORRECTIF : ajout du paramètre optionnel "ref" pour pouvoir lire le contenu
    // d'un fichier sur une branche précise (et pas seulement sur main). Indispensable
    // pour repousser des modifications sur une branche déjà existante : il faut lire
    // le sha ACTUEL du fichier sur CETTE branche, pas sur main.
    async lireFichier(lienGithub: string, cheminFichier: string, ref?: string) {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);
        const reponse = await this.octokit.rest.repos.getContent({
            owner, repo, path: cheminFichier, ...(ref ? { ref } : {}),
        });
        if (Array.isArray(reponse.data) || !('content' in reponse.data)) {
            throw new BadRequestException('Ce chemin ne correspond pas à un fichier');
        }
        const contenu = Buffer.from(reponse.data.content, 'base64').toString('utf-8');
        return { contenu, sha: reponse.data.sha };
    }

    // CORRECTIF : idempotente. Si la branche existe déjà (cas d'un développeur qui
    // revient traiter un bug déjà poussé une première fois), on ne lève plus d'erreur —
    // on réutilise simplement la branche existante au lieu de faire échouer tout le push.
    async creerBranche(lienGithub: string, nomNouvelleBranche: string) {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);
        const refMain = await this.octokit.rest.git.getRef({ owner, repo, ref: 'heads/main' });
        const shaDepart = refMain.data.object.sha;

        try {
            await this.octokit.rest.git.createRef({
                owner, repo, ref: `refs/heads/${nomNouvelleBranche}`, sha: shaDepart,
            });
            this.logger.log(`Branche ${nomNouvelleBranche} créée`);
        } catch (erreur: any) {
            // 422 = "Reference already exists" — pas une vraie erreur dans notre cas,
            // ça veut juste dire qu'on repousse sur une branche déjà créée précédemment.
            if (erreur.status !== 422) {
                throw erreur;
            }
            this.logger.log(`Branche ${nomNouvelleBranche} déjà existante — réutilisation`);
        }

        return { message: 'branche prête', branche: nomNouvelleBranche };
    }

    async modifierFichier(
        lienGithub: string,
        cheminFichier: string,
        nouveauContenu: string,
        nomBranche: string,
        shaActuel: string,
    ) {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);
        const reponse = await this.octokit.rest.repos.createOrUpdateFileContents({
            owner, repo, path: cheminFichier,
            message: "Correction automatique appliquée par l'agent IA",
            content: Buffer.from(nouveauContenu, 'utf-8').toString('base64'),
            sha: shaActuel,
            branch: nomBranche,
        });
        return { sha: reponse.data.content?.sha, urlCommit: reponse.data.commit?.html_url,message:"le fichier a ete modfier" };
    }

    async ouvrirPullRequest(lienGithub: string, nomBranche: string, titre: string, description: string) {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);
        const reponse = await this.octokit.rest.pulls.create({
            owner, repo, title: titre, body: description, head: nomBranche, base: 'main',
        });
          this.logger.log(`Pull Request créée : ${reponse.data.html_url}`);
        return { url: reponse.data.html_url, numero: reponse.data.number };
    }

    //recuperer les fichiers sur github a partir du dernier commit pour afficher l'arborescence dans le webcontanier

      async obtenirArborescenceComplete(lienGithub: string) {
    const { owner, repo } = this.extraireOwnerRepo(lienGithub);
    this.logger.log(`Récupération de l'arborescence complète pour ${owner}/${repo}`);

    // 1. SHA du dernier commit sur main
    const refMain = await this.octokit.rest.git.getRef({ owner, repo, ref: 'heads/main' });
    const shaCommit = refMain.data.object.sha;

    // 2. Tout l'arbre du dépôt, en une seule requête (recursive: '1')
    const arbre = await this.octokit.rest.git.getTree({
      owner, repo, tree_sha: shaCommit, recursive: '1' as any,
    });

    // Exclut les dossiers volumineux/inutiles pour l'agent
    const DOSSIERS_EXCLUS = ['node_modules', '.git', '.next', 'dist', 'build'];
    const fichiersUtiles = arbre.data.tree.filter(
      (item) =>
        item.type === 'blob' &&
        !DOSSIERS_EXCLUS.some((dossier) => item.path?.includes(`${dossier}/`)),
    );

    this.logger.log(`${fichiersUtiles.length} fichiers à récupérer`);

    // 3. Contenu de chaque fichier, en parallèle
    const fichiersAvecContenu = await Promise.all(
      fichiersUtiles.map(async (item) => {
        const blob = await this.octokit.rest.git.getBlob({ owner, repo, file_sha: item.sha! });
        const contenu = Buffer.from(blob.data.content, 'base64').toString('utf-8');
        return { chemin: item.path!, contenu };
      }),
    );

    this.logger.log(`Arborescence récupérée avec succès (${fichiersAvecContenu.length} fichiers)`);
    return fichiersAvecContenu;
  }
}