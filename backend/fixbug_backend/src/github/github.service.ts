import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Octokit } from 'octokit';

@Injectable()
export class GithubService {
    private readonly logger = new Logger(GithubService.name);
    private octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    private extraireOwnerRepo(lienGithub: string): { owner: string; repo: string } {
        if (!lienGithub) throw new BadRequestException('Le lien GitHub est requis');
        const correspondance = lienGithub.match(/github\.com\/([^/]+)\/([^/]+?)(\.git)?\/?$/);
        if (!correspondance) throw new BadRequestException('Lien GitHub invalide');
        return { owner: correspondance[1], repo: correspondance[2] };
    }

    async listerFichiers(lienGithub: string, chemin = '') {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);
        const reponse = await this.octokit.rest.repos.getContent({ owner, repo, path: chemin });
        if (!Array.isArray(reponse.data)) return [];
        return reponse.data.map((f) => ({ nom: f.name, type: f.type, chemin: f.path }));
    }

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

    async creerBranche(lienGithub: string, nomNouvelleBranche: string) {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);
        const refMain = await this.octokit.rest.git.getRef({ owner, repo, ref: 'heads/main' });
        const shaDepart = refMain.data.object.sha;

        try {
            await this.octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${nomNouvelleBranche}`, sha: shaDepart });
            this.logger.log(`Branche ${nomNouvelleBranche} créée`);
        } catch (erreur: any) {
            if (erreur.status !== 422) throw erreur;
            this.logger.log(`Branche ${nomNouvelleBranche} déjà existante — réutilisation`);
        }
        return { message: 'branche prête', branche: nomNouvelleBranche };
    }

    async modifierFichier(lienGithub: string, cheminFichier: string, nouveauContenu: string, nomBranche: string, shaActuel?: string) {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);
        const reponse = await this.octokit.rest.repos.createOrUpdateFileContents({
            owner, repo, path: cheminFichier,
            message: "Correction automatique appliquée par l'agent IA",
            content: Buffer.from(nouveauContenu, 'utf-8').toString('base64'),
            ...(shaActuel ? { sha: shaActuel } : {}),
            branch: nomBranche,
        });
        return { sha: reponse.data.content?.sha, urlCommit: reponse.data.commit?.html_url, message: "le fichier a ete modfier" };
    }

    
    async pousserTousLesFichiers(
        lienGithub: string,
        nomBranche: string,
        fichiers: { chemin: string; contenu: string }[],
        messageCommit = "Mise à jour depuis l'espace de travail FixBug",
    ) {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);

        
        await this.creerBranche(lienGithub, nomBranche);

     
        const refBranche = await this.octokit.rest.git.getRef({ owner, repo, ref: `heads/${nomBranche}` });
        const shaCommitParent = refBranche.data.object.sha;
        const commitParent = await this.octokit.rest.git.getCommit({ owner, repo, commit_sha: shaCommitParent });
        const shaArbreParent = commitParent.data.tree.sha;

        if (fichiers.length === 0) {
            return { branche: nomBranche, sha: shaCommitParent, message: 'Aucun fichier à pousser' };
        }

       
        this.logger.log(`Création de ${fichiers.length} blobs pour la branche ${nomBranche}`);
        const entreesArbre = await Promise.all(
            fichiers.map(async (f) => {
                const contenuNormalise = f.contenu.replace(/\r\n/g, '\n');
                const blob = await this.octokit.rest.git.createBlob({
                    owner, repo,
                    content: Buffer.from(contenuNormalise, 'utf-8').toString('base64'),
                    encoding: 'base64',
                });
                return { path: f.chemin, mode: '100644' as const, type: 'blob' as const, sha: blob.data.sha };
            }),
        );

        // 4. Nouvel arbre basé sur l'arbre parent — fichiers non listés préservés
        const nouvelArbre = await this.octokit.rest.git.createTree({
            owner, repo, base_tree: shaArbreParent, tree: entreesArbre,
        });

        // 5. Nouveau commit
        const nouveauCommit = await this.octokit.rest.git.createCommit({
            owner, repo, message: messageCommit, tree: nouvelArbre.data.sha, parents: [shaCommitParent],
        });

        // 6. Avance la branche sur ce nouveau commit
        await this.octokit.rest.git.updateRef({ owner, repo, ref: `heads/${nomBranche}`, sha: nouveauCommit.data.sha });

        this.logger.log(`Push atomique réussi sur ${nomBranche} : ${nouveauCommit.data.sha}`);
        return { branche: nomBranche, sha: nouveauCommit.data.sha };
    }

    async ouvrirPullRequest(lienGithub: string, nomBranche: string, titre: string, description: string) {
    const { owner, repo } = this.extraireOwnerRepo(lienGithub);
    try {
        const reponse = await this.octokit.rest.pulls.create({ owner, repo, title: titre, body: description, head: nomBranche, base: 'main' });
        this.logger.log(`Pull Request créée : ${reponse.data.html_url}`);
        return { url: reponse.data.html_url, numero: reponse.data.number };
    } catch (erreur: any) {
        
        const dejaExistante = erreur.status === 422 && JSON.stringify(erreur.response?.data ?? '').includes('pull request already exists');
        if (!dejaExistante) throw erreur;

        this.logger.log(`Une Pull Request existe déjà pour ${nomBranche} — récupération de la PR existante`);
        const prsExistantes = await this.octokit.rest.pulls.list({ owner, repo, head: `${owner}:${nomBranche}`, state: 'open' });
        const pr = prsExistantes.data[0];
        if (!pr) throw erreur; 
        return { url: pr.html_url, numero: pr.number };
    }
}

    async obtenirArborescenceComplete(lienGithub: string) {
        const { owner, repo } = this.extraireOwnerRepo(lienGithub);
        this.logger.log(`Récupération de l'arborescence complète pour ${owner}/${repo}`);

        const refMain = await this.octokit.rest.git.getRef({ owner, repo, ref: 'heads/main' });
        const shaCommit = refMain.data.object.sha;

        const arbre = await this.octokit.rest.git.getTree({ owner, repo, tree_sha: shaCommit, recursive: '1' as any });

        
        const EXTENSIONS_BINAIRES = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.pdf', '.mp4', '.mp3', '.zip'];
        const DOSSIERS_EXCLUS = ['node_modules', '.git', '.next', 'dist', 'build'];
        const fichiersUtiles = arbre.data.tree.filter(
            (item) =>
                item.type === 'blob' &&
                !DOSSIERS_EXCLUS.some((dossier) => item.path?.includes(`${dossier}/`)) &&
                !EXTENSIONS_BINAIRES.some((ext) => item.path?.toLowerCase().endsWith(ext)),
        );

        this.logger.log(`${fichiersUtiles.length} fichiers à récupérer`);

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
