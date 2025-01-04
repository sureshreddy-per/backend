import { IsOptional, IsString, IsNumber, IsEnum, IsLatLong, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum ProduceType {
  GRAIN = 'grain',
  VEGETABLE = 'vegetable',
  FRUIT = 'fruit',
  PULSE = 'pulse',
  OTHER = 'other'
}

export enum QualityGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  PENDING = 'PENDING'
}

export class ProduceFilterDto {
  @ApiProperty({ enum: ProduceType, required: false })
  @IsOptional()
  @IsEnum(ProduceType)
  type?: ProduceType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ enum: QualityGrade, required: false })
  @IsOptional()
  @IsEnum(QualityGrade)
  grade?: QualityGrade;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsLatLong()
  location?: string; // Format: "lat,lng"

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  radius?: number; // Search radius in kilometers

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  farmerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minQuantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxQuantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  searchTerm?: string; // For searching in description or farmer name

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortBy?: 'price' | 'date' | 'quantity' | 'distance';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
} 