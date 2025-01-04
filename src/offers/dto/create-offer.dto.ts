import { IsNotEmpty, IsNumber, IsString, IsUUID, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty({ description: 'ID of the produce being offered for' })
  @IsNotEmpty()
  @IsUUID()
  produceId: string;

  @ApiProperty({ description: 'ID of the buyer making the offer' })
  @IsNotEmpty()
  @IsUUID()
  buyerId: string;

  @ApiProperty({ description: 'Price per unit' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiProperty({ description: 'Quantity being offered for' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'Optional message with the offer' })
  @IsOptional()
  @IsString()
  message?: string;
} 