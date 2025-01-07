import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
import { ProduceCategory } from '../../produce/entities/produce.entity';

export class CreateDailyPriceDto {
  @IsUUID()
  @IsNotEmpty()
  buyer_id: string;

  @IsNotEmpty()
  produce_category: ProduceCategory;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  minimum_quantity: number;
} 