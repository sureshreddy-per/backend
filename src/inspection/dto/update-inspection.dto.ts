import { IsString, IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InspectionStatus, InspectionMethod, DeviceInfo, EnvironmentalFactors, ImageAnalysis } from '../entities/inspection.entity';
import { DeviceInfoDto, EnvironmentalFactorsDto, ImageAnalysisDto } from './create-inspection.dto';

export class UpdateInspectionDto {
  @IsOptional()
  @IsString()
  inspectorId?: string;

  @IsOptional()
  @IsString()
  qualityId?: string;

  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @IsOptional()
  @IsEnum(InspectionMethod)
  method?: InspectionMethod;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo?: DeviceInfoDto;

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