import { IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProduceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  qualityId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  photos?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  video?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lng?: number;
} 