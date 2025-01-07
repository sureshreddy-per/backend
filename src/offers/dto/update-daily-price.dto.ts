import { IsNumber, IsOptional, Min } from 'class-validator';
import { ProduceCategory } from '../../produce/entities/produce.entity';

export class UpdateDailyPriceDto {
  @IsOptional()
  produce_category?: ProduceCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimum_quantity?: number;

  @IsOptional()
  is_active?: boolean;
} 