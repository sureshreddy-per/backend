import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, IsLatitude, IsLongitude, Min, IsArray } from 'class-validator';
import { ProduceCategory } from '../entities/produce.entity';

export class CreateProduceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ProduceCategory })
  @IsEnum(ProduceCategory)
  category: ProduceCategory;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  availableQuantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  produceTag?: string;

  @ApiProperty()
  @IsLatitude()
  latitude: number;

  @ApiProperty()
  @IsLongitude()
  longitude: number;

  @ApiProperty()
  @IsUUID()
  farmerId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  farmId?: string;
} 