import { Controller, Post, Body, UseGuards, Get, Query, Patch, ParseIntPipe, Param, Delete } from '@nestjs/common';
import { ProjetsService } from './projets.service';
import { CreerProjetDto } from './DTO/creer-projet.dto';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { RolesGuard } from 'src/users/guards/roles.guards';
import { Roles } from 'src/users/decorators/roles.decorators';
import { JwtAuthGuard } from 'src/users/guards/jwt-auth.guard'
import { ModifierProjetDto } from './DTO/modifier-projet.dto';
@Controller('projets')
@UseGuards(JwtAuthGuard)
export class ProjetsController {
    constructor(private projetService: ProjetsService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('CHEF_PROJET')
    async creerPorjet(@CurrentUser() utilisateur: { id: number }, @Body() data: CreerProjetDto) {
        return this.projetService.creerProjet(utilisateur.id, data)
    }

    @Get()
    async listerProjet(@CurrentUser() utilisateur: { id: number, role: string }) {
        return this.projetService.listeProjet(utilisateur)
    }

    @Get('recherche')
    async rechercherProjet(@CurrentUser() utilisateur: { id: number, role: string }, @Query('q') motRecherche: string) {
        return this.projetService.rechercherProjet(utilisateur, motRecherche)
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles('CHEF_PROJET')
    async modifierProjet(@Param('id', ParseIntPipe) projetId: number, @CurrentUser() utilisateur: { id: number }, @Body() data: ModifierProjetDto) {
        return this.projetService.modifierProjet(projetId, utilisateur.id, data)
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('CHEF_PROJET')
    async supprimerProjet(@Param('id', ParseIntPipe) projetId: number, @CurrentUser() utilisateur: { id: number }) {
        return this.projetService.supprimerProjet(projetId, utilisateur.id)
    }
    @Get('statistiques')
    @UseGuards(RolesGuard)
    @Roles('CHEF_PROJET')
    obtenirStatistiques(@CurrentUser() utilisateur: { id: number }) {
        return this.projetService.obtenirStatistiques(utilisateur.id);
    }
    @Get(':id')
    obtenirProjet(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() utilisateur: { id: number; role: string },
    ) {
        return this.projetService.obtenirProjet(id, utilisateur);
    }

    @Delete(':id/quitter')
    async quitterProjet(@Param('id', ParseIntPipe) projetId: number, @CurrentUser() utilisateur: { id: number }) {
        return this.projetService.quitterProjet(projetId, utilisateur.id)
    }

}
