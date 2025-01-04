import { IsOptional, IsNumber, IsDateString, IsBoolean, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBuyerPriceDto {
  @ApiPropertyOptional({ description: 'New price per unit in the base currency' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;

  @ApiPropertyOptional({ description: 'New effective date for the price' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: 'Whether the price is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 