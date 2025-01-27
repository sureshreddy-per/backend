import { IsString, IsNumber, IsOptional, IsArray, IsUUID, Min, Max, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';

export class CreateQualityAssessmentDto {
  @ApiProperty({ description: 'ID of the produce being assessed' })
  @IsUUID()
  produce_id: string;

  @ApiProperty({ description: 'Name of the produce' })
  @IsString()
  produce_name: string;

  @ApiProperty({ description: 'Category of the produce', enum: ProduceCategory })
  @IsEnum(ProduceCategory)
  category: ProduceCategory;

  @ApiProperty({ description: 'Quality grade (0-10)', minimum: 0, maximum: 10 })
  @IsNumber()
  @Min(0)
  @Max(10)
  quality_grade: number;

  @ApiProperty({ description: 'Confidence level of the assessment (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence_level: number;

  @ApiPropertyOptional({ description: 'List of defects found in the produce' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  defects?: string[];

  @ApiPropertyOptional({ description: 'List of recommendations for the produce' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recommendations?: string[];

  @ApiProperty({ description: 'Category-specific assessment details' })
  @IsObject()
  category_specific_assessment: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata about the assessment' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
