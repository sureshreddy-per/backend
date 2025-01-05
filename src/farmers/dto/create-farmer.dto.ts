import { IsString, IsOptional, IsObject, IsNumber, Min, Max, IsEmail, IsPhoneNumber } from 'class-validator';
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
  @ApiPropertyOptional({ description: 'Size of the farm in acres' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: 'Types of crops grown' })
  @IsOptional()
  @IsString({ each: true })
  crops?: string[];
}

export class CreateFarmerDto {
  @ApiProperty({ description: 'Farmer\'s user ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Farmer\'s name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Farmer\'s phone number' })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Farmer\'s email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @ApiPropertyOptional({ type: FarmDetailsDto })
  @IsOptional()
  @IsObject()
  farmDetails?: FarmDetailsDto;
} 