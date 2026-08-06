import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async envoyerParametre(email: string, prenom: string, motDePasse: string,role:string) {
    const senderEmail = this.configService.get<string>('GMAIL_USER');

    const mailOptions = {
      from: `"Fixbug" <${senderEmail}>`,
      to: email, 
      subject: 'Votre compte Fixbug a été créé',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Chers <strong>${prenom}</strong>,</p>
          <p>Un compte Fixbug a été créé pour vous par l'administrateur.</p>
          <p>Voici votre mot de passe temporaire : <strong style="font-size: 16px; color: #00D08C;">${motDePasse}</strong></p>
          <p>Nous vous recommandons de le modifier dès votre première connexion, depuis votre profil.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email via Gmail:', error);
      throw new InternalServerErrorException('Impossible d\'envoyer l\'email d\'activation.');
    }
  }
  //---mail lors de la desactivation d'un compte 
  async comptedescativer(email: string, prenom: string){
  const senderEmail = this.configService.get<string>('GMAIL_USER');

    const mailOptions = {
      from: `"Fixbug" <${senderEmail}>`,
      to: email, 
      subject: 'Votre compte Fixbug a été descativer',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>chers <strong>${prenom}</strong>,</p>
          <p>votre compte Fixbug a été desavtiver  par l' administrateur.</p>
          <p>veuillez le contacter au 681282580 pour plus d'informations</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email via Gmail:', error);
      throw new InternalServerErrorException('Impossible d\'envoyer l\'email d\'activation.');
    }
  }

  //---mail lors de la desactivation d'un compte 
  async compteactiver(email: string, prenom: string){
  const senderEmail = this.configService.get<string>('GMAIL_USER');

    const mailOptions = {
      from: `"Fixbug" <${senderEmail}>`,
      to: email, 
      subject: 'Votre compte Fixbug a été activé',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>chers <strong>${prenom}</strong>,</p>
          <p>votre compte Fixbug a été active  par l' administrateur.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email via Gmail:', error);
      throw new InternalServerErrorException('Impossible d\'envoyer l\'email d\'activation.');
    }}
}