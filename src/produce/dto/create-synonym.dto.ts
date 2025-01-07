import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class CreateSynonymDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  words: string[];
} 