import { IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';
import { QualityGrade } from '../../produce/enums/quality-grade.enum';

export class CreateOfferDto {
  @IsUUID()
  produceId: string;

  @IsUUID()
  buyerId: string;

  @IsNumber()
  pricePerUnit: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  qualityGrade?: QualityGrade;

  @IsOptional()
  @IsNumber()
  quotedPrice?: number;
} 