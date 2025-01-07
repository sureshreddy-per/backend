import { IsString, IsUUID, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFarmDto {
  @ApiProperty()
  @IsUUID()
  farmer_id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  size: number;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lat_lng?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;
} 