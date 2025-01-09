import { IsNotEmpty, IsNumber, IsEnum, IsOptional, Min, IsUUID } from 'class-validator';
import { ProduceCategory } from '../../produce/entities/produce.entity';

export class CreateDailyPriceDto {
  @IsUUID()
  @IsNotEmpty()
  buyer_id: string;

  @IsEnum(ProduceCategory)
  @IsNotEmpty()
  produce_category: ProduceCategory;

  @IsNumber()
  @Min(0)
  min_price: number;

  @IsNumber()
  @Min(0)
  max_price: number;

  @IsNumber()
  @Min(0)
  minimum_quantity: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  valid_days?: number;
} 