import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsEnum,
  ValidateNested,
  IsObject,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { CategorySpecificAssessment } from "../interfaces/category-assessments.interface";

export class CreateQualityAssessmentDto {
  @IsUUID()
  @IsNotEmpty()
  produce_id: string;

  @IsUUID()
  @IsNotEmpty()
  inspector_id: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(-1)
  @Max(10)
  quality_grade: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  confidence_level: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  defects?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recommendations?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProduceCategory)
  @IsNotEmpty()
  category: ProduceCategory;

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  category_specific_assessment: CategorySpecificAssessment;

  @IsString()
  @IsNotEmpty()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
    message: 'Location must be in format "latitude,longitude" (e.g. "12.34,56.78")',
  })
  location: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  metadata?: {
    inspector_id?: string;
    inspection_id?: string;
    ai_model_version?: string;
    assessment_parameters?: Record<string, any>;
    images?: string[];
  };
}
