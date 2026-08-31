import { Controller, Post, Get, Body, Query, UseGuards, UseInterceptors, UploadedFiles, Param, Patch, ParseIntPipe } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BugsService } from './bugs.service';
import { DeclarerBugDto } from './DTO/declarer-bug.dto';
import { JwtAuthGuard } from 'src/users/guards/jwt-auth.guard';
import { RolesGuard } from 'src/users/guards/roles.guards';
import { Roles } from 'src/users/decorators/roles.decorators';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
// CORRECTIF : Proposition n'est plus utilisé dans ce fichier — pousser-github
// reçoit maintenant l'état complet des fichiers, plus les propositions IA seules.
// Import retiré.

@Controller('bugs')
@UseGuards(JwtAuthGuard)
export class BugsController {
  constructor(private bugsService: BugsService) { }

  @Post()
  @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('captures', 5))
  declarerBug(
    @CurrentUser() utilisateur: { id: number },
    @Body() dto: DeclarerBugDto,
    @UploadedFiles() fichiers: Express.Multer.File[],
  ) {
    return this.bugsService.declarerBug(utilisateur.id, dto, fichiers);
  }

  @Get()
  listerBugs(@CurrentUser() utilisateur: { id: number; role: string }, @Query('projetId') projetId?: string) {
    return this.bugsService.listerBugs(utilisateur, projetId ? Number(projetId) : undefined);
  }
  @Patch(':id/prendre-en-charge')
  @UseGuards(RolesGuard)
  @Roles('DEVELOPPEUR')
  prendreEnCharge(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: { id: number }) {
    return this.bugsService.prendreEnCharge(id, u.id);
  }
  @Get(':id/fichiers')
  @UseGuards(RolesGuard)
  @Roles('DEVELOPPEUR')
  obtenirFichiers(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: { id: number }) {
    return this.bugsService.obtenirFichiersDuBug(id, u.id);
  }

  @Patch(':id/demander-analyse')
  @UseGuards(RolesGuard)
  @Roles('DEVELOPPEUR')
  demanderAnalyse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() u: { id: number },
    @Body() body: { instructionDeveloppeur?: string; fichiers: { chemin: string; contenu: string }[] },
  ) {
    return this.bugsService.demanderAnalyseIA(id, u.id, body?.instructionDeveloppeur, body.fichiers ?? []);
  }


  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('DEVELOPPEUR', 'CHEF_PROJET')
  obtenirBug(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: { id: number; role: string }) {
    return this.bugsService.obtenirBug(id, u);
  }

  @Post('chat-testeur')
  @UseGuards(RolesGuard)
  @Roles('TESTEUR')
  @UseInterceptors(FilesInterceptor('captures'))
  discuterEtDeclarer(
    @CurrentUser() u: { id: number },
    @Body() body: { projetId: string; message: string; historique: string },
    @UploadedFiles() fichiers: Express.Multer.File[],
  ) {
    const historique = body.historique ? JSON.parse(body.historique) : [];
    return this.bugsService.discuterEtDeclarer(u.id, Number(body.projetId), body.message, historique, fichiers);
  }

  // CORRECTIF : reçoit désormais `fichiers` (état complet du WebContainer, filtré
  // côté frontend des dossiers générés et fichiers binaires), et non plus
  // `propositions` (sous-ensemble des seuls fichiers modifiés par l'IA). C'est ce
  // qui permet à pousserTousLesFichiers de committer l'état réel du workspace.
  @Post(':id/pousser-github')
  @UseGuards(RolesGuard)
  @Roles('DEVELOPPEUR')
  pousserSurGithub(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() u: { id: number },
    @Body() body: { fichiers: { chemin: string; contenu: string }[] },
  ) {
    return this.bugsService.pousserSurGithub(id, u.id, body.fichiers ?? []);
  }

  @Post(':id/creer-pull-request')
  @UseGuards(RolesGuard)
  @Roles('DEVELOPPEUR')
  creerPullRequest(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: { id: number }) {
    return this.bugsService.creerPullRequest(id, u.id);
  }
}