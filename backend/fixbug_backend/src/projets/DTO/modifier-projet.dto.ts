import { IsString, IsOptional, IsArray, IsUrl } from 'class-validator';

export class ModifierProjetDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Le lien GitHub doit être une URL valide' })
  lienGithub?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];
}