import { IsString, IsUUID, IsNumber, IsEnum, IsOptional, IsArray, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProduceCategory, ProduceStatus } from '../entities/produce.entity';
import { QualityGrade } from '../enums/quality-grade.enum';
import { Type } from 'class-transformer';

export class CreateProduceDto {
  @ApiProperty()
  @IsUUID()
  farmer_id: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  farm_id?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ProduceCategory })
  @IsEnum(ProduceCategory)
  produce_category: ProduceCategory;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiProperty()
  @IsNumber()
  price_per_unit: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ enum: ProduceStatus })
  @IsEnum(ProduceStatus)
  @IsOptional()
  status?: ProduceStatus;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  harvested_at?: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiry_date?: Date;

  @ApiPropertyOptional({ enum: QualityGrade })
  @IsEnum(QualityGrade)
  @IsOptional()
  quality_grade?: QualityGrade;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  produce_tag?: Date;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image_urls?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  video_url?: string;

  @IsOptional()
  @IsString()
  language?: string;
}