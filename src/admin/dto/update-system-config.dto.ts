import { IsNumber, IsOptional, Min, Max, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSystemConfigDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  min_produce_price?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  max_produce_price?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(90)
  max_offer_validity_days?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  min_transaction_amount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  inspection_required_above?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  auto_approve_below?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
} 