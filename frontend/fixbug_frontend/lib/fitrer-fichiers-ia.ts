// lib/filtrer-fichiers-ia.ts — NOUVEAU fichier
type FichierEnvoye = { chemin: string; contenu: string };

// Fichiers qui n'apportent RIEN à l'IA pour corriger un bug, mais peuvent être énormes
const FICHIERS_EXCLUS = [
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
];
const DOSSIERS_EXCLUS = ['node_modules/', '.next/', 'dist/', 'build/', '.git/'];
const EXTENSIONS_EXCLUES = ['.svg', '.png', '.jpg', '.jpeg', '.ico', '.woff', '.woff2', '.map'];

// Taille max par fichier individuel (en caractères) — au-delà, probablement généré/minifié
const TAILLE_MAX_PAR_FICHIER = 30_000; // ~30 Ko
// Budget total pour l'ensemble des fichiers envoyés à l'IA
const BUDGET_TOTAL_CARACTERES = 150_000; // ~150 Ko, large marge sous les limites de contexte

export function filtrerFichiersPourIA(fichiers: Record<string, string>): { fichiersFiltres: FichierEnvoye[]; nombreExclus: number } {
  let candidats = Object.entries(fichiers)
    .filter(([chemin]) => !FICHIERS_EXCLUS.includes(chemin.split('/').pop() ?? ''))
    .filter(([chemin]) => !DOSSIERS_EXCLUS.some((d) => chemin.includes(d)))
    .filter(([chemin]) => !EXTENSIONS_EXCLUES.some((ext) => chemin.endsWith(ext)))
    .filter(([, contenu]) => contenu.length <= TAILLE_MAX_PAR_FICHIER)
    .map(([chemin, contenu]) => ({ chemin, contenu }));

  const nombreExclusParFiltre = Object.keys(fichiers).length - candidats.length;

  // Si même après filtrage on dépasse le budget, on garde les plus petits fichiers en priorité
  // (les gros fichiers sont souvent les moins pertinents pour un bug ciblé)
  candidats.sort((a, b) => a.contenu.length - b.contenu.length);
  let total = 0;
  const fichiersFiltres: FichierEnvoye[] = [];
  for (const f of candidats) {
    if (total + f.contenu.length > BUDGET_TOTAL_CARACTERES) break;
    fichiersFiltres.push(f);
    total += f.contenu.length;
  }

  return { fichiersFiltres, nombreExclus: nombreExclusParFiltre + (candidats.length - fichiersFiltres.length) };
}