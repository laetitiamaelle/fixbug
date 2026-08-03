import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateProfilDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'le mot de passe doit avoir au moins 8 caractere' })
  motdepasse?: string;
}