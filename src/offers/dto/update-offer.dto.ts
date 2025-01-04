import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfferStatus } from '../enums/offer-status.enum';

export class UpdateOfferDto {
  @ApiProperty({ enum: OfferStatus, description: 'New status for the offer' })
  @IsEnum(OfferStatus)
  status: OfferStatus;

  @ApiPropertyOptional({ description: 'Optional message for the status update' })
  @IsOptional()
  @IsString()
  message?: string;
} 