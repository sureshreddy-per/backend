import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBuyerDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^-?\d+\.\d+-?\d+\.\d+$/, {
    message: 'lat_lng must be in format "latitude-longitude" (e.g., "12.9716-77.5946")',
  })
  lat_lng?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registration_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gst?: string;
} 