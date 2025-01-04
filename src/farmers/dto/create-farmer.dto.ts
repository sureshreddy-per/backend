import { IsString, IsOptional, IsObject, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class FarmDetailsDto {
  @ApiProperty({ description: 'Size of the farm in acres' })
  @IsString()
  size: string;

  @ApiProperty({ description: 'Types of crops grown' })
  @IsString({ each: true })
  crops: string[];
}

export class CreateFarmerDto {
  @ApiProperty({ description: 'Farmer\'s name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Farmer\'s description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @ApiPropertyOptional({ type: FarmDetailsDto })
  @IsOptional()
  @IsObject()
  farmDetails?: FarmDetailsDto;
} 