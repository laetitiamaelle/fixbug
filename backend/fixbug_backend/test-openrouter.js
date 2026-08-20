require('dotenv').config();

const MODELES = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'dots-studio/dots-3-note-preview:free',
  'openai/gpt-oss-20b:free',
];



// Un outil FACTICE pour l'instant — pas encore branché sur GithubService
const outils = [
  {
    type: 'function',
    function: {
      name: 'lire_fichier',
      description: 'Lit le contenu d\'un fichier du dépôt de code source',
      parameters: {
        type: 'object',
        properties: {
          chemin: {
            type: 'string',
            description: 'Le chemin du fichier à lire, ex: src/components/LoginButton.tsx',
          },
        },
        required: ['chemin'],
      },
    },
  },
];

async function testerFunctionCalling() {
  const reponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemma-4-26b-a4b-it:free',
      messages: [
        {
          role: 'user',
          content: "Le bouton de connexion est censé être bleu mais il est noir. Le fichier concerné s'appelle probablement LoginButton.tsx. Peux-tu m'aider à comprendre le problème ?",
        },
      ],
      tools: outils,
    }),
  });

  const data = await reponse.json();
  console.log(JSON.stringify(data, null, 2));
}

testerFunctionCalling();