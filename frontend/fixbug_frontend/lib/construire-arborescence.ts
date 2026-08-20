type FichierPlat = { chemin: string; contenu: string };

export function construireArborescenceWebContainer(fichiers: FichierPlat[]) {
  const racine: any = {};

  for (const { chemin, contenu } of fichiers) {
    const segments = chemin.split('/'); // ex: "src/utils/format.js" → ["src", "utils", "format.js"]
    let noeudCourant = racine;

    segments.forEach((segment, index) => {
      const estDernierSegment = index === segments.length - 1;

      if (estDernierSegment) {
        // Le dernier segment est le nom du fichier lui-même
        noeudCourant[segment] = { file: { contents: contenu } };
      } else {
        // Un segment intermédiaire est un dossier — on le crée s'il n'existe pas encore
        if (!noeudCourant[segment]) {
          noeudCourant[segment] = { directory: {} };
        }
        noeudCourant = noeudCourant[segment].directory;
      }
    });
  }

  return racine;
}