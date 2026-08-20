import { Controller, Post, Get, Body, Query, UseGuards, UseInterceptors, UploadedFiles, Param, Patch, ParseIntPipe } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BugsService } from './bugs.service';
import { DeclarerBugDto } from './DTO/declarer-bug.dto';
import { JwtAuthGuard } from 'src/users/guards/jwt-auth.guard';
import { RolesGuard } from 'src/users/guards/roles.guards';
import { Roles } from 'src/users/decorators/roles.decorators';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';

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

  @Get(':id/fichiers')
  @UseGuards(RolesGuard)
  @Roles('DEVELOPPEUR')
  obtenirFichiers(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: { id: number }) {
    return this.bugsService.obtenirFichiersDuBug(id, u.id);
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
}