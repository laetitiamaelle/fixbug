import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: { sub: number; email: string; role: string }) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
    });

    if (!utilisateur || !utilisateur.actif) {
      throw new UnauthorizedException('Compte introuvable ou désactivé');
    }

    return { id: utilisateur.id,
       email: utilisateur.email, 
       nom: utilisateur.nom,
       prenom: utilisateur.prenom,
       role: utilisateur.role };
  }
}