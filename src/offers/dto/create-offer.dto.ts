import { IsString, IsNumber, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfferStatus } from '../entities/offer.entity';

export class CreateOfferDto {
  @ApiProperty({ description: 'ID of the produce listing' })
  @IsUUID()
  produceId: string;

  @ApiProperty({ description: 'Quality grade used for pricing' })
  @IsString()
  gradeUsed: string;

  @ApiProperty({ description: 'Quoted price for the produce' })
  @IsNumber()
  quotedPrice: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: {
    overrideReason?: string;
    autoCalculated: boolean;
    originalPrice?: number;
  };
} 