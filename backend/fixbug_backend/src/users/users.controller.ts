import { Body, Patch, Controller, Post, Get, UseGuards, Delete, Param, ParseIntPipe, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './DTO/register.dto';
import { LoginDto } from './DTO/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UpdateProfilDto } from './DTO/modifier-profil.dto';
import { RolesGuard } from './guards/roles.guards';
import { Roles } from './decorators/roles.decorators';
import { CreerUtilisateurDto } from './DTO/creer-utilisateur.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@Controller('users')
@ApiTags('Utilisateurs')
export class UsersController {
    constructor(private userService: UsersService) { }
    @Post('register')
    async register(@Body() data: RegisterDto) {
        return this.userService.register(data);
    }
    @Post('login')
    async login(@Body() data: LoginDto) {
        return this.userService.login(data)
    }

    @Get('moi')
    @UseGuards(JwtAuthGuard)
    moi(@CurrentUser() utilisateur: any) {
        return utilisateur;
    }

    @Patch('profil')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    modifierProfil(
        @CurrentUser() utilisateur: { id: number },
        @Body() dto: UpdateProfilDto,
    ) {
        return this.userService.modifierProfil(utilisateur.id, dto);
    }

    @Post('admin/utilisateurs')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMINISTRATEUR')
    creerUtilisateur(@Body() dto: CreerUtilisateurDto) {
        return this.userService.creerUtilisateur(dto);
    }

    @Delete('admin/utilisateurs/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMINISTRATEUR')
    supprimerUtilisateur(@Param('id', ParseIntPipe) id: number) {
        return this.userService.supprimerUtilisateur(id);
    }

    @Get('admin/utilisateurs')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMINISTRATEUR')
    listerUtilisateurs(
        @Query('page') page = '1',
        @Query('limit') limit = '',
        @Query('recherche') recherche?: string,
        @Query('statut') statut?: string,
    ) {
        return this.userService.listerUtilisateursAdmin(Number(page), Number(limit), recherche, statut);
    }

    @Patch('admin/utilisateurs/:id/activer')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMINISTRATEUR')
    activerCompte(@Param('id', ParseIntPipe) id: number) {
        return this.userService.activerCompte(id);
    }

    @Patch('admin/utilisateurs/:id/desactiver')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMINISTRATEUR')
    desactiverCompte(@Param('id', ParseIntPipe) id: number) {
        return this.userService.desactiverCompte(id);
    }
    @Get('projets/:id/rechercher-testeur')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('CHEF_PROJET')
    async rechercherTesteur(
        @Param('id', ParseIntPipe) projetId: number,
        @Query('q') motCle: string,
    ) {
        return this.userService.rechercherUtilisateur(projetId, motCle);
    }

    @Get('admin/utilisateurs/statistiques')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMINISTRATEUR')
    statistiques() {
        return this.userService.obtenirStatistiques();
    }
}
