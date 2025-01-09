import { IsNumber, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProduceCategory } from '../../produce/entities/produce.entity';

export class UpdateInspectionBaseFeeDto {
  @ApiProperty({
    description: 'Category of produce',
    enum: ProduceCategory
  })
  @IsEnum(ProduceCategory)
  produce_category: ProduceCategory;

  @ApiProperty({
    description: 'Base inspection fee for the produce category',
    minimum: 100,
    maximum: 5000,
    example: 500
  })
  @IsNumber()
  @Min(100)
  @Max(5000)
  inspection_base_fee: number;
} 