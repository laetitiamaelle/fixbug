const bcrypt = require('bcrypt');

const motDePasseTape = '8ScREv30zD8h';
const hashEnBase = '$2b$10$KZeFZd/uNIDN0PTy9UlKBug7evYKRfu6zmJA9R0FJWNfZJJSqyvb.';

bcrypt.compare(motDePasseTape, hashEnBase).then((resultat) => {
  console.log('Correspondance :', resultat);
});