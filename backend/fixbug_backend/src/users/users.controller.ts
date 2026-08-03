import { Body, Patch, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './DTO/register.dto';
import { LoginDto } from './DTO/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UpdateProfilDto } from './DTO/modifier-profil.dto';
@Controller('users')
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
    @UseGuards(JwtAuthGuard)
    modifierProfil(
        @CurrentUser() utilisateur: { id: number },
        @Body() dto: UpdateProfilDto,
    ) {
        return this.userService.modifierProfil(utilisateur.id, dto);
    }
}
