import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class DeclarerBugDto {
  @IsOptional() @IsString() titre?: string;
  @IsNotEmpty() @IsString() description!: string;
  @IsNotEmpty() @Type(() => Number) @IsInt() projetId!: number;
}