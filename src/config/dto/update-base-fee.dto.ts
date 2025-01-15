import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBaseFeeDto {
  @ApiProperty({
    description: 'The new base fee percentage',
    minimum: 0,
    maximum: 100,
    example: 5
  })
  @IsNumber()
  @Min(0)
  percentage: number;
}

export class UpdateInspectionBaseFeeDto {
  @ApiProperty({
    description: 'The new base inspection fee amount',
    minimum: 0,
    example: 50
  })
  @IsNumber()
  @Min(0)
  inspection_base_fee: number;

  @ApiProperty({
    description: 'The produce category for which to update the fee',
    example: 'FOOD_GRAINS'
  })
  produce_category: string;
}
