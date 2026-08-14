require('dotenv').config();
const { Octokit } = require('octokit');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function listerFichiers() {
  const reponse = await octokit.rest.repos.getContent({
    owner: 'darling',  
    repo: 'portfolio',           
    path: '',                 
  });

  console.log(reponse.data.map((fichier) => ({ nom: fichier.name, type: fichier.type })));
}
// listerFichiers();
// console.log ("bonjour")

// lire le contenu d'un fichier dans un depot
async function lireFichier(cheminFichier) {
  const reponse = await octokit.rest.repos.getContent({
    owner: 'laetitiamaelle',
    repo: 'fixbug',
    path: cheminFichier, 
  });

  
  const contenuDecode = Buffer.from(reponse.data.content, 'base64').toString('utf-8');

  console.log('--- Contenu du fichier ---');
  console.log(contenuDecode);

  console.log('--- SHA du fichier (à retenir) ---');
  console.log(reponse.data.sha);
}

lireFichier('backend/fixbug_backend/src/users/users.service.ts'); 