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


export const outilConversationTesteur = [
  {
    type: 'function',
    function: {
      name: 'declarerBug',
      description:
        "Enregistre un nouveau bug dans le système, UNIQUEMENT si l'utilisateur a décrit un problème technique concret et suffisamment clair (quoi ne fonctionne pas, où). Ne jamais appeler cet outil pour une salutation, une question générale, ou une description encore trop vague — dans ce cas, pose plutôt une question de clarification en texte normal.",
      parameters: {
        type: 'object',
        properties: {
          titre: { type: 'string', description: 'Titre court et factuel du bug (ex: "Bug sur le bouton Ajouter — couleur incorrecte"), maximum 10 mots.' },
          descriptionReformulee: { type: 'string', description: "La description du problème, reformulée clairement à partir de ce que l'utilisateur a dit." },
        },
        required: ['titre', 'descriptionReformulee'],
      },
    },
  },
];