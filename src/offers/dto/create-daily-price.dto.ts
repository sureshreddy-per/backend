import { IsString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDailyPriceDto {
  @ApiProperty({ description: 'Name of the produce' })
  @IsString()
  @IsNotEmpty()
  produce_name: string;

  @ApiProperty({ description: 'Minimum price for the produce' })
  @IsNumber()
  @Min(0)
  min_price: number;

  @ApiProperty({ description: 'Maximum price for the produce' })
  @IsNumber()
  @Min(0)
  max_price: number;

  @ApiProperty({ description: 'Average price for the produce' })
  @IsNumber()
  @Min(0)
  average_price: number;

  @ApiPropertyOptional({ description: 'Name of the market where price was recorded' })
  @IsString()
  @IsOptional()
  market_name?: string;

  @ApiPropertyOptional({ description: 'Location where price was recorded' })
  @IsString()
  @IsOptional()
  location?: string;
}
