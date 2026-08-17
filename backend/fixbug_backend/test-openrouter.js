require('dotenv').config();

const MODELES = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'dots-studio/dots-3-note-preview:free',
  'openai/gpt-oss-20b:free',
];

async function testerAvecImage() {
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
          content: [
            {
              type: 'text',
              text: "Voici la description d'un bug : \"Le bouton de connexion ,je voudrais qu'il soit bleu\". Voici une capture d'écran du problème. Que vois-tu sur cette image qui pourrait expliquer ce bug ?",
            },
            {
              type: 'image_url',
              image_url: {
                url: 'https://res.cloudinary.com/nciauxse/image/upload/v1786961848/fixbug/bugs/oi24dfarnczc5xjuhmna.png', // ex: https://res.cloudinary.com/.../fixbug/bugs/xxxxx.jpg
              },
            },
          ],
        },
      ],
    }),
  });

  const data = await reponse.json();
  console.log(JSON.stringify(data, null, 2));
}

testerAvecImage();
