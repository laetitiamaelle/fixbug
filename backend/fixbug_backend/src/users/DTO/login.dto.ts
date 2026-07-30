import { IsEmail, IsString,IsNotEmpty,MinLength } from 'class-validator';

export class LoginDto {
     @IsNotEmpty({message:'le champ email ne doit pas etre vide'})
     @IsEmail()
     email!: string;
     @IsNotEmpty({message:'le champ mot de passe ne doit pas etre vide'})
     @IsString()
     @MinLength(8, { message: 'le mot de passe doit avoir au moins 8 caractere' })
     motdepasse!: string;
}