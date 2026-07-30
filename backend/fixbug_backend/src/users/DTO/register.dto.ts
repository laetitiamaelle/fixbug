import { IsEmail, IsString, MinLength, IsIn, IsNotEmpty } from 'class-validator';

export class RegisterDto {
    @IsNotEmpty({message:'le champ nom ne doit pas etre vide'})
    @IsString({message:'le nom doit etre une chaine de caracter'})
    nom!: string;
    @IsNotEmpty({message:'le champ prenom ne doit pas etre vide'})
    @IsString()
    prenom!: string;
    @IsNotEmpty({message:'le champ email ne doit pas etre vide'})
    @IsEmail()
    email!: string;
    @IsNotEmpty({message:'le champ mot de passe ne doit pas etre vide'})
    @IsString()
    @MinLength(8, { message: 'le mot de passe doit avoir au moins 8 caractere' })
    motdepasse!: string;
    @IsIn(['TESTEUR', 'CHEF_PROJET'], { message: 'Role invalide' })
    role!:'TESTEUR'| 'CHEF_PROJET';
}