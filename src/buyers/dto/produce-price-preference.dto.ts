import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProducePricePreferenceDto {
  @ApiProperty({ description: 'Name of the produce' })
  @IsString()
  produce_name: string;

  @ApiProperty({ description: 'Minimum price willing to pay for the produce' })
  @IsNumber()
  @Min(0)
  min_price: number;

  @ApiProperty({ description: 'Maximum price willing to pay for the produce' })
  @IsNumber()
  @Min(0)
  max_price: number;
} 