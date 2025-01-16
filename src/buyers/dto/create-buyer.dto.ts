import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class CreateBuyerDto {
  @ApiProperty({ description: 'Business name of the buyer' })
  @IsString()
  business_name: string;

  @ApiPropertyOptional({ description: "Location in 'latitude,longitude' format (e.g., '12.9716,77.5946')" })
  @IsString()
  @IsOptional()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
    message: "Location must be in format: latitude,longitude (e.g., 12.9716,77.5946)",
  })
  location?: string;

  @ApiPropertyOptional({ description: 'Name of the location' })
  @IsString()
  @IsOptional()
  location_name?: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsString()
  @IsOptional()
  address?: string;
}
