import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';

export class UpdateInspectionBaseFeeDto {
  @IsEnum(ProduceCategory)
  produce_category: ProduceCategory;

  @IsNumber()
  @Min(0)
  base_fee: number;

  @IsString()
  @IsOptional()
  updated_by?: string;
} 