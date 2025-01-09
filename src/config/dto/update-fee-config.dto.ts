import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInspectionDistanceFeeDto {
  @ApiProperty({
    description: 'Fee per kilometer for inspection distance calculations',
    minimum: 1,
    maximum: 100,
    example: 5
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  fee_per_km: number;

  @ApiProperty({
    description: 'Maximum fee that can be charged for inspection distance',
    minimum: 100,
    maximum: 5000,
    example: 500
  })
  @IsNumber()
  @Min(100)
  @Max(5000)
  max_distance_fee: number;
} 