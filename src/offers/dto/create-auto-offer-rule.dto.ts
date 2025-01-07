import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateAutoOfferRuleDto {
  @IsNotEmpty()
  @IsUUID()
  buyer_id: string;

  @IsNotEmpty()
  @IsString()
  produce_category: string;

  @IsOptional()
  @IsNumber()
  min_quantity?: number;

  @IsOptional()
  @IsNumber()
  max_quantity?: number;

  @IsOptional()
  @IsNumber()
  min_price?: number;

  @IsOptional()
  @IsNumber()
  max_price?: number;

  @IsOptional()
  @IsString()
  preferred_grade?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
} 