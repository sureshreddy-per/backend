import { IsOptional, IsNumber, IsString, Min, Max, IsEnum, IsIn, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProduceCategory } from '../enums/produce-category.enum';
import {
  FoodGrainsFilterDto,
  OilseedsFilterDto,
  FruitsFilterDto,
  VegetablesFilterDto,
  SpicesFilterDto,
  FibersFilterDto,
  SugarcaneFilterDto,
  FlowersFilterDto,
  MedicinalPlantsFilterDto
} from './category-filters.dto';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}

export enum SortableField {
  // Base fields
  PRICE = 'price',
  DATE_LISTED = 'dateListed',
  DISTANCE = 'distance',

  // Food Grains
  MOISTURE_CONTENT = 'moistureContent',
  PROTEIN_CONTENT = 'proteinContent',
  FOREIGN_MATTER = 'foreignMatter',

  // Oilseeds
  OIL_CONTENT = 'oilContent',

  // Fruits
  SWEETNESS = 'sweetness',

  // Fibers
  FIBER_STRENGTH = 'fiberStrength',
  STAPLE_LENGTH = 'stapleLength',
  TRASH_CONTENT = 'trashContent',

  // Sugarcane
  BRIX_CONTENT = 'brixContent',
  FIBER_CONTENT = 'fiberContent',
  STALK_LENGTH = 'stalkLength',

  // Spices
  VOLATILE_OIL_CONTENT = 'volatileOilContent',
  PURITY = 'purity',

  // Flowers
  STEM_LENGTH = 'stemLength',

  // Medicinal Plants
  ESSENTIAL_OIL_YIELD = 'essentialOilYield',
  PURITY_OF_EXTRACTS = 'purityOfExtracts'
}

export enum SortConditionOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  GREATER_THAN_EQUALS = 'gte',
  LESS_THAN_EQUALS = 'lte'
}

export class SortCondition {
  @IsEnum(SortableField)
  @ApiPropertyOptional({ enum: SortableField, description: 'Field to check condition against' })
  field: SortableField;

  @IsEnum(SortConditionOperator)
  @ApiPropertyOptional({ enum: SortConditionOperator, description: 'Condition operator' })
  operator: SortConditionOperator;

  @ApiPropertyOptional({ description: 'Value to compare against' })
  value: any;
}

export class SortField {
  @IsEnum(SortableField)
  @ApiPropertyOptional({ enum: SortableField, description: 'Field to sort by' })
  field: SortableField;

  @IsEnum(SortOrder)
  @ApiPropertyOptional({ enum: SortOrder, description: 'Sort order' })
  order: SortOrder;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortCondition)
  @ApiPropertyOptional({ type: [SortCondition], description: 'Conditions that must be met for this sort to apply' })
  conditions?: SortCondition[];
}

export class SortFieldGroup {
  @ValidateNested({ each: true })
  @Type(() => SortField)
  @ApiPropertyOptional({ type: [SortField], description: 'Fields to sort by in this group' })
  fields: SortField[];

  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Priority level of this group (1-5, 1 being highest)', default: 1 })
  priority: number = 1;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortCondition)
  @ApiPropertyOptional({ type: [SortCondition], description: 'Conditions that must be met for this group to apply' })
  conditions?: SortCondition[];
}

export class SortingOptionsDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortFieldGroup)
  @ApiPropertyOptional({ 
    type: [SortFieldGroup], 
    description: 'Groups of sort fields with conditions. Groups will be applied in order of priority.' 
  })
  groups?: SortFieldGroup[];
}

export class LocationDto {
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  @ApiPropertyOptional({ description: 'Latitude between -90 and 90 degrees' })
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  @ApiPropertyOptional({ description: 'Longitude between -180 and 180 degrees' })
  longitude: number;
}

export class ProduceFilterDto {
  @IsOptional()
  @IsEnum(ProduceCategory)
  @ApiPropertyOptional({ enum: ProduceCategory, description: 'Category of produce' })
  category?: ProduceCategory;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @ApiPropertyOptional({ description: 'Minimum price' })
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @ApiPropertyOptional({ description: 'Maximum price' })
  maxPrice?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: LocationDto })
  location?: LocationDto;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1000)
  @ApiPropertyOptional({ description: 'Search radius in kilometers (max 1000km)' })
  radius?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: 'Page number (max 100)', default: 1 })
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: 'Items per page (max 100)', default: 10 })
  limit?: number = 10;

  @IsOptional()
  @ApiPropertyOptional({ type: SortingOptionsDto })
  sort?: SortingOptionsDto;

  @IsOptional()
  @ApiPropertyOptional({ type: FoodGrainsFilterDto })
  foodGrains?: FoodGrainsFilterDto;

  @IsOptional()
  @ApiPropertyOptional({ type: OilseedsFilterDto })
  oilseeds?: OilseedsFilterDto;

  @IsOptional()
  @ApiPropertyOptional({ type: FruitsFilterDto })
  fruits?: FruitsFilterDto;

  @IsOptional()
  @ApiPropertyOptional({ type: VegetablesFilterDto })
  vegetables?: VegetablesFilterDto;

  @IsOptional()
  @ApiPropertyOptional({ type: SpicesFilterDto })
  spices?: SpicesFilterDto;

  @IsOptional()
  @ApiPropertyOptional({ type: FibersFilterDto })
  fibers?: FibersFilterDto;

  @IsOptional()
  @ApiPropertyOptional({ type: SugarcaneFilterDto })
  sugarcane?: SugarcaneFilterDto;

  @IsOptional()
  @ApiPropertyOptional({ type: FlowersFilterDto })
  flowers?: FlowersFilterDto;

  @IsOptional()
  @ApiPropertyOptional({ type: MedicinalPlantsFilterDto })
  medicinalPlants?: MedicinalPlantsFilterDto;
} 