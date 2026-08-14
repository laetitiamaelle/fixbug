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
    owner: 'Jonh-jonhy',
    repo: 'Todolist',
    path: cheminFichier, 
  });

  
  const contenuDecode = Buffer.from(reponse.data.content, 'base64').toString('utf-8');

  console.log('--- Contenu du fichier ---');
  console.log(contenuDecode);

  console.log('--- SHA du fichier (à retenir) ---');
  console.log(reponse.data.sha);
}

// lireFichier('index.html'); 

//creer une branche
async function creerBranche(nomNouvelleBranche) {
  //  récupérer le SHA du dernier commit sur main
  const refMain = await octokit.rest.git.getRef({
    owner: 'laetitiamaelle',
    repo: 'fixbug',
    ref: 'heads/main', // 'heads/' = branche 
  });

  const shaDepart = refMain.data.object.sha;
  console.log('SHA de départ (main) :', shaDepart);

  //  créer la nouvelle branche à partir de ce SHA
  const nouvelleRef = await octokit.rest.git.createRef({
    owner: 'laetitiamaelle',
    repo: 'fixbug',
    ref: `refs/heads/${nomNouvelleBranche}`, // chemin complet exigé par l'API
    sha: shaDepart,
  });

  console.log('Branche créée :', nouvelleRef.data.ref);
//   console.log('sha de la nouvelle branche:',nouvelleRef.data.content.sha)
}

// creerBranche('test');

// modifier un fichier

async function modifierFichier(cheminFichier, nouveauContenu, nomBranche, shaActuel) {
  const reponse = await octokit.rest.repos.createOrUpdateFileContents({
    owner: 'laetitiamaelle',
    repo: 'fixbug',
    path: cheminFichier,
    message: 'Correction automatique appliquée par l\'agent IA', // message du commit
    content: Buffer.from(nouveauContenu, 'utf-8').toString('base64'), // encodage inverse de tout à l'heure
    sha: shaActuel,       // le sha du fichier existant, pour dire "je remplace CETTE version"
    branch: nomBranche,   // la branche créée à l'étape précédente — jamais 'main' !
  });

  console.log('Commit créé, nouveau sha du fichier :', reponse.data.content.sha);
  console.log('URL du commit :', reponse.data.commit.html_url);
}

async function testerModification() {
  const lecture = await octokit.rest.repos.getContent({
    owner: 'laetitiamaelle',
    repo: 'fixbug',
    path: 'README.md',
  });

  const nouveauTexte = ' test de modification par fixbug';

  await modifierFichier('README.md', nouveauTexte, 'test', lecture.data.sha);
}

testerModification();