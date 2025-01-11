import { IsString, IsUUID, IsNumber, IsObject } from "class-validator";

export interface QualityMetadata {
  finalPrice?: number;
  priceMultiplier?: number;
  finalizedAt?: Date;
  notes?: string;
}

export interface QualityCriteria {
  freshness: number;
  cleanliness: number;
  packaging: number;
  consistency: number;
}

export class CreateQualityDto {
  @IsUUID()
  produceId: string;

  @IsObject()
  criteria: QualityCriteria;

  @IsString()
  assessedBy: string;

  @IsObject()
  metadata?: QualityMetadata;
}
