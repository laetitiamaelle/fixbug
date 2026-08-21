export const outilsAnalyse = [
  {
    type: 'function',
    function: {
      name: 'listerFichiers',
      description: 'Liste les fichiers et dossiers présents à un chemin donné dans le dépôt GitHub du projet.',
      parameters: {
        type: 'object',
        properties: { chemin: { type: 'string', description: 'Dossier à explorer. "" pour la racine.' } },
        required: ['chemin'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lireFichier',
      description: "Lit le contenu texte complet d'un fichier précis du dépôt.",
      parameters: {
        type: 'object',
        properties: { cheminFichier: { type: 'string', description: 'Chemin complet du fichier.' } },
        required: ['cheminFichier'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'proposerModification',
      description: "Propose une correction pour un fichier. N'écrit RIEN sur GitHub — enregistre la proposition, en attente de validation humaine.",
      parameters: {
        type: 'object',
        properties: {
          cheminFichier: { type: 'string' },
          nouveauContenu: { type: 'string', description: 'Contenu complet et corrigé du fichier.' },
          explication: { type: 'string' },
        },
        required: ['cheminFichier', 'nouveauContenu', 'explication'],
      },
    },
  },
];