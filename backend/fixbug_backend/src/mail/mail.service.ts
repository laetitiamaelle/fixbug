import { Injectable } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';

@Injectable()
export class MailService {
  private brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY as string });

  async envoyerMotDePasseGenere(
    email: string,
    prenom: string,
    motDePasse: string,
    role: string,
  ) {
    const roleUser = this.formaterRole(role);

    await this.brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: process.env.SENDER_NAME as string,
        email: process.env.SENDER_EMAIL as string,
      },
      to: [{ email, name: prenom }],
      subject: 'Votre compte Fixbug a été créé',
      htmlContent: `
        <p>Bonjour ${prenom},</p>
        <p>Un compte Fixbug a été créé pour vous par  l'administrateur, avec le rôle <strong>${roleUser}</strong>.</p>
        <p>Voici votre mot de passe temporaire : <strong>${motDePasse}</strong></p>
        <p>Nous vous recommandons de le modifier a votre première connexion, depuis votre profil.</p>
      `,
    });
  }

  private formaterRole(role: string): string {
    const roles: Record<string, string> = {
      TESTEUR: 'Testeur',
      CHEF_PROJET: 'Chef de projet',
    };
    return roles[role] ?? role;
  }
}