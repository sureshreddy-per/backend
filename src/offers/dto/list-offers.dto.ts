import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OfferStatus } from '../enums/offer-status.enum';

export enum OfferSortBy {
  PRICE_PER_UNIT = 'price_per_unit',
  TOTAL_PRICE = 'total_price',
  QUANTITY = 'quantity',
  QUALITY = 'quality',
  DISTANCE = 'distance',
  BUYER_RATING = 'buyer_rating',
  FARMER_RATING = 'farmer_rating',
  CREATED_AT = 'created_at'
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}

export class SortOption {
  @ApiPropertyOptional({
    enum: OfferSortBy,
    description: 'Field to sort by'
  })
  @IsEnum(OfferSortBy)
  field: OfferSortBy;

  @ApiPropertyOptional({
    enum: SortOrder,
    description: 'Sort order (ASC or DESC)',
    default: SortOrder.DESC
  })
  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.DESC;
}

export class ListOffersDto {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    description: 'Page number for pagination'
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 10,
    minimum: 1,
    description: 'Number of items per page'
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: OfferStatus,
    description: 'Filter offers by status'
  })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @ApiPropertyOptional({
    type: [SortOption],
    description: 'Array of sort options. Each option contains a field and order. Multiple sorts will be applied in order.',
    example: [
      { field: 'price_per_unit', order: 'DESC' },
      { field: 'quality', order: 'DESC' }
    ]
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortOption)
  sort?: SortOption[];
} 