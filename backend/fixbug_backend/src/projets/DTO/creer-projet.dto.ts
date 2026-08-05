import { IsString, IsNotEmpty, IsOptional, IsArray, IsUrl } from 'class-validator';

export class CreerProjetDto {
  @IsNotEmpty()
  @IsString()
  nom!: string;

  @IsOptional()
  @IsString()
  description!: string;

  @IsUrl({}, { message: 'Le lien GitHub doit être une URL valide' })
  lienGithub!: string;

  @IsArray()
  @IsString({ each: true })
  technologies!: string[];
}