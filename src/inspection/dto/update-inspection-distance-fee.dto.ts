import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInspectionDistanceFeeDto {
  @ApiProperty({
    description: 'Minimum distance in kilometers',
    minimum: 0,
    maximum: 1000,
    example: 0,
  })
  @IsNumber()
  @Min(0)
  @Max(1000)
  min_distance: number;

  @ApiProperty({
    description: 'Maximum distance in kilometers',
    minimum: 1,
    maximum: 1000,
    example: 50,
  })
  @IsNumber()
  @Min(1)
  @Max(1000)
  max_distance: number;

  @ApiProperty({
    description: 'Fee per kilometer',
    minimum: 1,
    maximum: 100,
    example: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  fee: number;

  @ApiProperty({
    description: 'ID of the user updating the fee',
    required: false,
  })
  @IsString()
  @IsOptional()
  updated_by?: string;
} 