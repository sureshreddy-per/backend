import { IsString, IsNumber, IsOptional, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  address: string;
}

export class StorageConditionsDto {
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @IsOptional()
  humidity?: number;
}

export class MetadataDto {
  @IsString()
  @IsOptional()
  harvestDate?: string;

  @IsString()
  @IsOptional()
  expiryDate?: string;

  @ValidateNested()
  @Type(() => StorageConditionsDto)
  @IsOptional()
  storageConditions?: StorageConditionsDto;

  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

export class CreateProduceDto {
  @IsString()
  farmerId: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  unit: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  currency: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ValidateNested()
  @Type(() => MetadataDto)
  @IsOptional()
  metadata?: MetadataDto;
} 