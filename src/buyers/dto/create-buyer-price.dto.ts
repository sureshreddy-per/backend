import { IsNotEmpty, IsString, IsNumber, IsDateString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBuyerPriceDto {
  @ApiProperty({ description: 'ID of the buyer setting the price' })
  @IsNotEmpty()
  @IsUUID()
  buyerId: string;

  @ApiProperty({ description: 'Quality grade for the produce (e.g., A, B, C)' })
  @IsNotEmpty()
  @IsString()
  qualityGrade: string;

  @ApiProperty({ description: 'Price per unit in the base currency' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiProperty({ description: 'Date from which this price is effective' })
  @IsNotEmpty()
  @IsDateString()
  effectiveDate: string;
} 