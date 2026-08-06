import { IsInt, IsNotEmpty } from 'class-validator';

export class InviterCollaborateurDto {
  @IsNotEmpty()
  @IsInt()
  utilisateurId!: number;
}