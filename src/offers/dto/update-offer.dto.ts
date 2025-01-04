import { IsNumber, IsOptional, IsString } from 'class-validator';
import { QualityGrade } from '../../produce/enums/quality-grade.enum';

export class UpdateOfferDto {
  @IsOptional()
  @IsNumber()
  pricePerUnit?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  qualityGrade?: QualityGrade;
} 