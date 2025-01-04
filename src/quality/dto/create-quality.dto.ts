import { IsString, IsNumber, IsOptional, IsObject, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQualityDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  grade: number;

  @IsNumber()
  confidence: number;

  @IsArray()
  @IsString({ each: true })
  defects: string[];

  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @IsOptional()
  @IsObject()
  criteria?: {
    appearance?: {
      color?: string[];
      size?: {
        min?: number;
        max?: number;
        unit?: string;
      };
      shape?: string[];
      texture?: string[];
    };
    defects?: {
      allowedTypes?: string[];
      maxPercentage?: number;
    };
    composition?: {
      moisture?: {
        min?: number;
        max?: number;
      };
      sugar?: {
        min?: number;
        max?: number;
      };
      [key: string]: {
        min?: number;
        max?: number;
      };
    };
  };

  @IsOptional()
  @IsObject()
  metadata?: {
    marketValue?: {
      min: number;
      max: number;
      currency: string;
    };
    shelfLife?: {
      duration: number;
      unit: string;
    };
    storageRequirements?: {
      temperature?: {
        min: number;
        max: number;
        unit: string;
      };
      humidity?: {
        min: number;
        max: number;
        unit: string;
      };
    };
  };

  @IsOptional()
  @IsString()
  rawAnalysis?: string;
} 