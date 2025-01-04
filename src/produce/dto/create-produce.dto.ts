import { IsString, IsNumber, IsOptional, IsArray, IsLatLong, IsEnum, Min, Max, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProduceType {
  WHEAT = 'WHEAT',
  RICE = 'RICE',
  CORN = 'CORN',
  SOYBEAN = 'SOYBEAN',
  COTTON = 'COTTON',
  OTHER = 'OTHER',
}

export enum ProduceUnit {
  KG = 'KG',
  TON = 'TON',
}

export class CreateProduceDto {
  @ApiProperty({ enum: ProduceType, description: 'Type of produce' })
  @IsEnum(ProduceType)
  type: ProduceType;

  @ApiProperty({ description: 'Quantity of produce' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ enum: ProduceUnit, description: 'Unit of measurement' })
  @IsEnum(ProduceUnit)
  unit: ProduceUnit;

  @ApiProperty({ description: 'Expected price per unit' })
  @IsNumber()
  @Min(0)
  expectedPrice: number;

  @ApiProperty({ description: 'Detailed description of the produce' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Array of photo URLs', type: [String] })
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  photos: string[];

  @ApiPropertyOptional({ description: 'Video URL of the produce' })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiProperty({ description: 'Location coordinates (lat,lng)' })
  @IsLatLong()
  location: string;

  @ApiPropertyOptional({ description: 'Maximum distance limit for buyers in kilometers' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  areaLimitKm?: number;
} 