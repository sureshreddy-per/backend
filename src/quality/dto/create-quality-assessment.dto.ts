import { IsNotEmpty, IsString, IsUUID, IsOptional, IsArray } from 'class-validator';

export class CreateQualityAssessmentDto {
  @IsUUID()
  @IsNotEmpty()
  produce_id: string;

  @IsUUID()
  @IsNotEmpty()
  inspector_id: string;

  @IsString()
  @IsNotEmpty()
  grade: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsNotEmpty()
  method: string;
} 