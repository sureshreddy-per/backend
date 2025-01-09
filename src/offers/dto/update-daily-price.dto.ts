import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateDailyPriceDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  min_price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  max_price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minimum_quantity?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  valid_days?: number;

  @IsOptional()
  valid_until?: Date;
} 