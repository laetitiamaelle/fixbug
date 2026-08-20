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

    async lireFichier(lienGithub: string, cheminFichier: string) {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);
        const reponse = await this.octokit.rest.repos.getContent({ owner, repo, path: cheminFichier });
        if (Array.isArray(reponse.data) || !('content' in reponse.data)) {
            throw new BadRequestException('Ce chemin ne correspond pas à un fichier');
        }
        const contenu = Buffer.from(reponse.data.content, 'base64').toString('utf-8');
        return { contenu, sha: reponse.data.sha };
    }

    async creerBranche(lienGithub: string, nomNouvelleBranche: string) {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);
        const refMain = await this.octokit.rest.git.getRef({ owner, repo, ref: 'heads/main' });
        const shaDepart = refMain.data.object.sha;
        await this.octokit.rest.git.createRef({
            owner, repo, ref: `refs/heads/${nomNouvelleBranche}`, sha: shaDepart,
        });
        return {message:"bracnche creer avec succes" ,branche: nomNouvelleBranche };
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