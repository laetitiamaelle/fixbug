import { IsEmail, IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreerUtilisateurDto {
  @IsNotEmpty()
  @IsString()
  nom!: string;

  @IsNotEmpty()
  @IsString()
  prenom!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsIn(['TESTEUR', 'CHEF_PROJET', 'ADMINISTRATEUR'], { message: 'Role invalide' })
  role!: 'TESTEUR' | 'CHEF_PROJET' | 'ADMINISTRATEUR';
}