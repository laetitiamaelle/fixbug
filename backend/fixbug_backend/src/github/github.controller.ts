import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { GithubService } from 'src/github/github.service';
import { JwtAuthGuard } from 'src/users/guards/jwt-auth.guard';

@Controller('github')
@UseGuards(JwtAuthGuard) // juste pour être sûr d'être connecté, pas de vérification de rôle ici (test uniquement)
export class GithubController {
  constructor(private githubService: GithubService) {}

  @Get('fichiers')
  listerFichiers(@Query('lien') lien: string, @Query('chemin') chemin?: string) {
    return this.githubService.listerFichiers(lien, chemin);
  }

  @Get('fichier')
  lireFichier(@Query('lien') lien: string, @Query('chemin') chemin: string) {
    return this.githubService.lireFichier(lien, chemin);
  }

  @Post('branche')
  creerBranche(@Body('lien') lien: string, @Body('nomBranche') nomBranche: string) {
    return this.githubService.creerBranche(lien, nomBranche);
  }

  @Post('modifier')
  modifierFichier(
    @Body('lien') lien: string,
    @Body('chemin') chemin: string,
    @Body('contenu') contenu: string,
    @Body('branche') branche: string,
    @Body('sha') sha: string,
  ) {
    return this.githubService.modifierFichier(lien, chemin, contenu, branche, sha);
  }

  @Post('pull-request')
  ouvrirPR(
    @Body('lien') lien: string,
    @Body('branche') branche: string,
    @Body('titre') titre: string,
    @Body('description') description: string,
  ) {
    return this.githubService.ouvrirPullRequest(lien, branche, titre, description);
  }
}