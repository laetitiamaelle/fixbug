export type NoeudArbre =
    | { type: "dossier"; nom: string; chemin: string; enfants: NoeudArbre[] }
    | { type: "fichier"; nom: string; chemin: string };

export function construireArbreAffichage(chemins: string[]): NoeudArbre[] {
    const racine: NoeudArbre[] = [];

    for (const chemin of chemins) {
        const segments = chemin.split("/");
        let niveauCourant = racine;
        let cheminPartiel = "";

        segments.forEach((segment, index) => {
            cheminPartiel = cheminPartiel ? `${cheminPartiel}/${segment}` : segment;
            const estDernier = index === segments.length - 1;

            if (estDernier) {
                niveauCourant.push({ type: "fichier", nom: segment, chemin: cheminPartiel });
                return;
            }

            let dossier = niveauCourant.find((n) => n.type === "dossier" && n.nom === segment) as
                | Extract<NoeudArbre, { type: "dossier" }>
                | undefined;

            if (!dossier) {
                dossier = { type: "dossier", nom: segment, chemin: cheminPartiel, enfants: [] };
                niveauCourant.push(dossier);
            }
            niveauCourant = dossier.enfants;
        });
    }

    // Tri : dossiers d'abord, puis fichiers, chacun par ordre alphabétique — comme VS Code
    function trier(noeuds: NoeudArbre[]): NoeudArbre[] {
        return noeuds
            .sort((a, b) => {
                if (a.type !== b.type) return a.type === "dossier" ? -1 : 1;
                return a.nom.localeCompare(b.nom);
            })
            .map((n) => (n.type === "dossier" ? { ...n, enfants: trier(n.enfants) } : n));
    }

    return trier(racine);
}