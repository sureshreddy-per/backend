import { IsString, IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InspectionMethod, DeviceInfo, EnvironmentalFactors, ImageAnalysis } from '../entities/inspection.entity';

export class DeviceInfoDto implements DeviceInfo {
  @IsString()
  type: string;

  @IsString()
  model: string;

  @IsString()
  os: string;
}

export class EnvironmentalFactorsDto implements EnvironmentalFactors {
  @IsOptional()
  @IsString()
  temperature?: number;

  @IsOptional()
  @IsString()
  humidity?: number;

  @IsOptional()
  @IsString()
  lighting?: string;
}

export class ImageAnalysisDto implements ImageAnalysis {
  @IsString({ each: true })
  imageUrls: string[];

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsString()
  format?: string;
}

export class CreateInspectionDto {
  @IsString()
  produceId: string;

  @IsOptional()
  @IsString()
  inspectorId?: string;

  @IsEnum(InspectionMethod)
  method: InspectionMethod;

  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EnvironmentalFactorsDto)
  environmentalFactors?: EnvironmentalFactorsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ImageAnalysisDto)
  imageAnalysis?: ImageAnalysisDto;

  @IsOptional()
  @IsString()
  notes?: string;
} 