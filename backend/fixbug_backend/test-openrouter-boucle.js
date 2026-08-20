require('dotenv').config();

const outils = [
  {
    type: 'function',
    function: {
      name: 'lire_fichier',
      description: "Lit le contenu d'un fichier du dépôt de code source",
      parameters: {
        type: 'object',
        properties: {
          chemin: { type: 'string', description: 'Le chemin du fichier à lire' },
        },
        required: ['chemin'],
      },
    },
  },
];

// Simule GithubService pour l'instant — sera remplacé par le vrai service au Bloc 4
function simulerLectureFichier(chemin) {
  return `
// ${chemin}
export function LoginButton() {
  return <button className="btn-noir">Se connecter</button>;
}
`;
}

async function appelerIA(messages) {
  const reponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemma-4-26b-a4b-it:free',
      messages,
      tools: outils,
    }),
  });
  return reponse.json();
}

async function testerBoucleComplete() {
  // Étape 1 : le message initial de l'utilisateur
  let messages = [
    {
      role: 'user',
      content: "Le bouton de connexion est censé être bleu mais il est noir. Le fichier concerné s'appelle probablement LoginButton.tsx. Peux-tu m'aider à comprendre le problème ?",
    },
  ];

  console.log('--- Étape 1 : première question ---');
  let data = await appelerIA(messages);
  const demandeOutil = data.choices[0].message;
  console.log('L\'IA demande :', JSON.stringify(demandeOutil.tool_calls, null, 2));

  // Étape 2 : on ajoute la demande de l'IA à l'historique
  messages.push(demandeOutil);

  // Étape 3 : on "exécute" l'outil (ici simulé), et on ajoute le résultat à l'historique
  const appelOutil = demandeOutil.tool_calls[0];
  const argumentsAppel = JSON.parse(appelOutil.function.arguments); // { chemin: "LoginButton.tsx" }
  const contenuFichier = simulerLectureFichier(argumentsAppel.chemin);

  messages.push({
    role: 'tool',
    tool_call_id: appelOutil.id, // relie cette réponse à LA demande précise de l'IA
    content: contenuFichier,
  });

  console.log('\n--- Étape 2 : on renvoie le contenu du fichier, l\'IA continue ---');
  data = await appelerIA(messages);
  console.log('Réponse finale de l\'IA :', data.choices[0].message.content);
}

testerBoucleComplete();