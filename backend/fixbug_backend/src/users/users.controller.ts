import { Body, Patch, Controller, Post, Get, UseGuards, Delete, Param, ParseIntPipe } from '@nestjs/common';
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
}
