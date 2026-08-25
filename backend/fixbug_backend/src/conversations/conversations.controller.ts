// conversations/conversations.controller.ts
import {
  Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles, ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from 'src/users/guards/jwt-auth.guard';
import { RolesGuard } from 'src/users/guards/roles.guards';
import { Roles } from 'src/users/decorators/roles.decorators';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TESTEUR')
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  // Bouton "Nouveau chat"
  @Post()
  creer(@CurrentUser() u: { id: number }, @Body() body: { projetId: string }) {
    return this.conversationsService.creerConversation(u.id, Number(body.projetId));
  }

  // Liste pour la sidebar 
  @Get()
  lister(@CurrentUser() u: { id: number }, @Query('projetId') projetId: string) {
    return this.conversationsService.listerConversations(u.id, Number(projetId));
  }

  // Charger une conversation précise avec ses messages
  @Get(':id')
  obtenir(@CurrentUser() u: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.conversationsService.obtenirConversation(u.id, id);
  }

  // Envoyer un message dans une conversation
  @Post(':id/messages')
  @UseInterceptors(FilesInterceptor('captures'))
  envoyerMessage(
    @CurrentUser() u: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { message: string },
    @UploadedFiles() fichiers: Express.Multer.File[],
  ) {
    return this.conversationsService.envoyerMessage(u.id, id, body.message, fichiers);
  }
}