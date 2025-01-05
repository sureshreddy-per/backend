import { IsString, IsNumber, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateOfferDto {
  @IsUUID()
  produceId: string;

  @IsNumber()
  pricePerUnit: number;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  qualityGrade?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: Date;
} 