import { Controller, ParseIntPipe, Post, UseGuards, Param, Body, Get, Delete, Patch } from '@nestjs/common';
import { CollaborationsService } from './collaborations.service';
import { JwtAuthGuard } from 'src/users/guards/jwt-auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { InviterCollaborateurDto } from './DTO/inviter-collaborateurs.dto';
import { RolesGuard } from 'src/users/guards/roles.guards';
import { Roles } from 'src/users/decorators/roles.decorators';

@UseGuards(JwtAuthGuard)
@Controller('collaborations')
export class CollaborationsController {
    constructor(private collaborateurService: CollaborationsService) { }
    @UseGuards(RolesGuard)
    @Roles('CHEF_PROJET')
    @Post('projets/:id/collaborateurs')
    async inviterCollaborateur(@Param('id', ParseIntPipe) projetId: number, @CurrentUser() utilisateur: { id: number }, @Body() testeurId: InviterCollaborateurDto) {
        return this.collaborateurService.inviterCollaborateur(projetId, utilisateur.id, testeurId.utilisateurId)
    }
    @Get('projets/:id/collaborateurs')
    async listerCollaborateur(@Param('id', ParseIntPipe) projetId: number, @CurrentUser() Chefprojet: { id: number }) {
        return this.collaborateurService.listerCollaborateur(projetId, Chefprojet.id)
    }

    @Delete('projets/:id/collaborateurs/:utilisateurId')
    async retirerCollaborateur(@Param('id', ParseIntPipe) ProjetId: number, @CurrentUser() chefprojet: { id: number }, @Param('utilisateurId', ParseIntPipe) utilisateurId: number) {
        return this.collaborateurService.retirerCollaborateur(ProjetId, chefprojet.id, utilisateurId)
    }

    @Get('invitations')
    async listerInvitations(@CurrentUser() testeur: { id: number }) {
        return this.collaborateurService.listerInvitationsTesteur(testeur.id)
    }

    @Patch('invitations/:id/accepterinvitation')
    async accepterInvitation(@Param('id', ParseIntPipe) invitationId: number, @CurrentUser() utilisateur: { id: number }) {
        return this.collaborateurService.AccepteInvitation(invitationId, utilisateur.id)
    }

    @Patch('invitations/:id/refuserinvitation')
    async refuserInvitation(@Param('id', ParseIntPipe) invitationId: number, @CurrentUser() utilisateur: { id: number }) {
        return this.collaborateurService.refuserInvitation(invitationId, utilisateur.id)
    }

    @Get('projets/:id/invitations')
    @UseGuards(RolesGuard)
    @Roles('CHEF_PROJET')
    listerInvitationsProjet(@Param('id', ParseIntPipe) projetId: number, @CurrentUser() u: { id: number }) {
        return this.collaborateurService.listerInvitationsProjet(projetId, u.id);
    }

    @Delete('projets/:id/invitations/:invitationId')
    @UseGuards(RolesGuard)
    @Roles('CHEF_PROJET')
    annulerInvitation(
        @Param('id', ParseIntPipe) projetId: number,
        @Param('invitationId', ParseIntPipe) invitationId: number,
        @CurrentUser() u: { id: number },
    ) {
        return this.collaborateurService.annulerInvitation(projetId, u.id, invitationId);
    }

}
