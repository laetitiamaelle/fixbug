import { randomBytes } from 'crypto';

export function genererMotDePasseAleatoire(longueur = 12): string {
  return randomBytes(longueur)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '') // enlève les caractères spéciaux problématiques
    .slice(0, longueur);
}