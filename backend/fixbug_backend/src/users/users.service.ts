import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './DTO/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './DTO/login.dto';

@Injectable()
export class UsersService {
  constructor(private prisma:PrismaService, private jwtService:JwtService,)  {}

async register(user:RegisterDto){
const emailExist=await this.prisma.utilisateur.findUnique({
    where:{email:user.email},
});

if(emailExist){
    throw new ConflictException('un utilisateur avec cette email exite deja')
}
 const motdepasseHache=await bcrypt.hash(user.motdepasse,10)

const utilisateur=await this.prisma.utilisateur.create({
    data:{
        nom:user.nom,
        prenom:user.prenom,
        email:user.email,
        motdepasse:motdepasseHache,
        role:user.role

    }
})
return "compte creer avec succes"
  }


  // fonction pour genrer le token
  private genererToken(utilisateur: { id: number; email: string; role: string }) {
    const payload = { sub: utilisateur.id, email: utilisateur.email, role: utilisateur.role };
    return {
      access_token: this.jwtService.sign(payload),
      utilisateur: { id: utilisateur.id, email: utilisateur.email, role: utilisateur.role },
    };
  }

  async login(data:LoginDto){

    const utilisateur= await this.prisma.utilisateur.findUnique({
        where:{email:data.email}
    })
    if(!utilisateur){
        throw new UnauthorizedException('aucun utilisateur avec cette email existe')
    }

    const motDePasseValide= await bcrypt.compare(data.motdepasse,utilisateur.motdepasse)
    if(!motDePasseValide){
        throw new UnauthorizedException('le mot de passe est incorrect')
    }
    if(!utilisateur.actif){
        throw new ForbiddenException('votre compte a ete desactivé')
    } 
    return this.genererToken(utilisateur)
  }
}
