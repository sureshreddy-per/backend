import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { InspectionRequestStatus } from '../entities/inspection-request.entity';

export enum InspectionSortBy {
  STATUS = 'status',
  QUALITY = 'quality',
  DISTANCE = 'distance',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at'
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}

export class ListInspectionsDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(InspectionRequestStatus)
  status?: InspectionRequestStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(InspectionSortBy)
  sortBy?: InspectionSortBy = InspectionSortBy.UPDATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  lng?: number;
}