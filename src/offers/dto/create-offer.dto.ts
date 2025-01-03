import { IsUUID, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty({ description: 'ID of the produce to make an offer for' })
  @IsUUID()
  produceId: string;

  @ApiProperty({ description: 'Price per unit offered' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Quantity of produce to purchase' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'Additional metadata for the offer' })
  @IsOptional()
  metadata?: Record<string, any>;
} 