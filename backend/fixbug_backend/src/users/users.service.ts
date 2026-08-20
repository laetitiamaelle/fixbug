import { ConflictException, ForbiddenException, Injectable, UnauthorizedException,NotFoundException,Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './DTO/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './DTO/login.dto';
import { CreerUtilisateurDto } from './DTO/creer-utilisateur.dto';
import { UpdateProfilDto } from './DTO/modifier-profil.dto';
import { MailService} from 'src/mail/mail.service';
import { genererMotDePasseAleatoire } from './utils/genere-mot-de-passe';


@Injectable()
export class UsersService {
   private readonly logger = new Logger(UsersService.name);
    constructor(private prisma: PrismaService, private jwtService: JwtService, private mailService:MailService) { }

    // ........................insciption.........................

    async register(user: RegisterDto) {
        const emailExist = await this.prisma.utilisateur.findUnique({
            where: { email: user.email },
        });

        if (emailExist) {
            throw new ConflictException('un utilisateur avec cette email exite deja')
        }
        const motdepasseHache = await bcrypt.hash(user.motdepasse, 10)

        const utilisateur = await this.prisma.utilisateur.create({
            data: {
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                motdepasse: motdepasseHache,
                role: user.role

            }
        })
        return { message: "compte creer avec succes" }
    }


    //.................fonction pour genrer le token...............

    private genererToken(utilisateur: { id: number; email: string; role: string }) {
        const payload = { sub: utilisateur.id, email: utilisateur.email, role: utilisateur.role };
        return {
            access_token: this.jwtService.sign(payload),
            utilisateur: { id: utilisateur.id, email: utilisateur.email, role: utilisateur.role },
        };
    }


    //....................login................
    async login(data: LoginDto) {

        const utilisateur = await this.prisma.utilisateur.findUnique({
            where: { email: data.email }
        })
        if (!utilisateur) {
            throw new UnauthorizedException('aucun utilisateur avec cette email existe')
        }

        const motDePasseValide = await bcrypt.compare(data.motdepasse, utilisateur.motdepasse)
        if (!motDePasseValide) {
            throw new UnauthorizedException('le mot de passe est incorrect')
        }
        if (!utilisateur.actif) {
            throw new ForbiddenException('votre compte a ete desactivé')
        }
        return this.genererToken(utilisateur)
    }

    // ..........................modifier le profil.....................
    async modifierProfil(userId: number, data: UpdateProfilDto) {
        const donneesAModifier: any = {};

        if (data.nom) donneesAModifier.nom = data.nom;
        if (data.prenom) donneesAModifier.prenom = data.prenom;
        if (data.motdepasse) {
            donneesAModifier.motdepasse = await bcrypt.hash(data.motdepasse, 10);
        }

        return this.prisma.utilisateur.update({
            where: { id: userId },
            data: donneesAModifier,
            select: { id: true, nom: true, prenom: true, email: true, role: true },
        });
    }

    // ------------------CREER UN UTILISATEUR/ADMINISTRATEUR ---------------

    
async creerUtilisateur(data: CreerUtilisateurDto) {
  const emailExist = await this.prisma.utilisateur.findUnique({
    where: { email: data.email },
  });
  if (emailExist) {
    throw new ConflictException('un utilisateur avec cette email existe deja');
  }

  if (data.role === 'ADMINISTRATEUR') {
    const adminExiste = await this.prisma.utilisateur.findFirst({
      where: { role: 'ADMINISTRATEUR' },
    });
    if (adminExiste) {
      throw new ConflictException('Un administrateur existe déjà. Un seul administrateur est autorisé.');
    }
  }

  const motDePasseGenere = genererMotDePasseAleatoire();
  console.log('MOT DE PASSE GÉNÉRÉ (à comparer) :', JSON.stringify(motDePasseGenere));
  const motdepasseHache = await bcrypt.hash(motDePasseGenere, 10);

  const utilisateur = await this.prisma.utilisateur.create({
    data: {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      motdepasse: motdepasseHache,
      role: data.role,
    },
    select: { id: true, nom: true, prenom: true, email: true, role: true, actif: true },
  });
  try{
  await this.mailService.envoyerParametre(data.email, data.prenom, motDePasseGenere,data.role);
  }catch(erreurEmail){
    console.error('Échec envoi email de bienvenue :', erreurEmail);
    this.logger.error(`Échec envoi email de bienvenue pour ${data.email}`, erreurEmail);
  }
  return utilisateur;
}

// ---------------------supprimer compte / administrateur ----------------------

async supprimerUtilisateur(id: number) {
  const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id } });
   if (!utilisateur) {
    throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
  }
  await this.prisma.utilisateur.delete({ where: { id } });
  await this.mailService.suppressionCompteMail(utilisateur.email,utilisateur.prenom)
  return { message: 'Utilisateur supprimé avec succès' };
}
//-----------------------lister les utilisateur -------------------

async listerUtilisateursAdmin(
  page: number,
  limit: number,
  recherche?: string,
  statut?: string,
) {
  const conditions: any[] = [
    { OR: [{ role: 'CHEF_PROJET' }, { role: 'TESTEUR' },{role:'DEVELOPPEUR'}] },
  ];

  if (recherche) {
    conditions.push({
      OR: [
        { nom: { contains: recherche, mode: 'insensitive' as const } },
        { prenom: { contains: recherche, mode: 'insensitive' as const } },
        { email: { contains: recherche, mode: 'insensitive' as const } },
      ],
    });
  }

  if (statut === 'actif') conditions.push({ actif: true });
  if (statut === 'desactive') conditions.push({ actif: false });

  const where = { AND: conditions };

  const [data, total] = await Promise.all([
    this.prisma.utilisateur.findMany({
      where,
      select: { id: true, nom: true, prenom: true, email: true, role: true, actif: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    this.prisma.utilisateur.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

// ---------------------activer compte / administrateur ----------------------

async activerCompte(id:number) {
   const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id } });
   if (!utilisateur) {
    throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
  }
  const resultat= await this.prisma.utilisateur.update({
    where: { id },
    data: { actif: true },
    select: { id: true, email: true, actif: true },
  });
  await this.mailService.compteactiver(utilisateur.email,utilisateur.prenom)
  return  resultat
}

// ---------------------desactiver compte / administrateur ----------------------
async desactiverCompte(id: number) {
  const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id } });

  if (!utilisateur) {
    throw new NotFoundException('Utilisateur introuvable');
  }

  if (utilisateur.role === 'ADMINISTRATEUR') {
    throw new ForbiddenException("Impossible de désactiver l'administrateur  du système");
  }
   await this.mailService.comptedescativer(utilisateur.email,utilisateur.prenom)
  return this.prisma.utilisateur.update({
    where: { id },
    data: { actif: false },
    select: { id: true, email: true, actif: true },
  });
}

//  ----------------rechercher un utilisateur-----------
async rechercherUtilisateur(projetId: number, motCle: string) {
  
  const collaborateursExistants = await this.prisma.projetCollaborateur.findMany({
    where: { projetId },
    select: { utilisateurId: true },
  });

  
  const invitationsEnAttente = await this.prisma.invitation.findMany({
    where: { projetId, statut: 'EN_ATTENTE' },
    select: { utilisateurId: true },
  });

 
  const idsAExclure = [
    ...collaborateursExistants.map((c) => c.utilisateurId),
    ...invitationsEnAttente.map((i) => i.utilisateurId),
  ];

  
  return this.prisma.utilisateur.findMany({
    where: {
      role: {in:['TESTEUR','DEVELOPPEUR']},
      actif: true,
      id: { notIn: idsAExclure },
      OR: [
        { nom: { contains: motCle, mode: 'insensitive' } },
        { prenom: { contains: motCle, mode: 'insensitive' } },
        { email: { contains: motCle, mode: 'insensitive' } },
      ],
    },
    select: { id: true, nom: true, prenom: true, email: true,role:true },
  });
}

// ---------------------statistiques (dashboard admin) ----------------------

async obtenirStatistiques() {
  const filtreRoles = { OR: [{ role: 'CHEF_PROJET' as const }, { role: 'TESTEUR' as const }] };

  const [total, actifs, desactives, testeurs, chefsProjet] = await Promise.all([
    this.prisma.utilisateur.count({ where: filtreRoles }),
    this.prisma.utilisateur.count({ where: { ...filtreRoles, actif: true } }),
    this.prisma.utilisateur.count({ where: { ...filtreRoles, actif: false } }),
    this.prisma.utilisateur.count({ where: { role: 'TESTEUR' } }),
    this.prisma.utilisateur.count({ where: { role: 'CHEF_PROJET' } }),
  ]);

  return { total, actifs, desactives, testeurs, chefsProjet };
}
}
