import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class CreateBuyerDto {
  @ApiProperty({ description: 'Business name of the buyer' })
  @IsString()
  business_name: string;

  @ApiPropertyOptional({ description: 'Location in format "lat,lng"' })
  @IsString()
  @IsOptional()
  lat_lng?: string;

  @ApiPropertyOptional({ description: 'Name of the location' })
  @IsString()
  @IsOptional()
  location_name?: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsString()
  @IsOptional()
  address?: string;
}
