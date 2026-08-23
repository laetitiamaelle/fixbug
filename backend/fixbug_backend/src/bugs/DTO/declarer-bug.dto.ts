import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class DeclarerBugDto {
  @IsNotEmpty() @IsString() description!: string;
  @IsNotEmpty() @Type(() => Number) @IsInt() projetId!: number;
}