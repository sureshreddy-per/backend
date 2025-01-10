import { IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInspectionBaseFeeDto {
  @ApiProperty({
    description: 'Category of produce',
    enum: ProduceCategory,
  })
  @IsEnum(ProduceCategory)
  produce_category: ProduceCategory;

  @ApiProperty({
    description: 'Base fee for inspection',
    minimum: 100,
    maximum: 5000,
    example: 500,
  })
  @IsNumber()
  @Min(100)
  @Max(5000)
  base_fee: number;

  @ApiProperty({
    description: 'ID of the user updating the fee',
    required: false,
  })
  @IsString()
  @IsOptional()
  updated_by?: string;
} 