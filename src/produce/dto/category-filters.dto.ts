import { IsOptional, IsNumber, IsString, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum GrainSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum SeedSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum FruitSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

export enum RipenessLevel {
  UNRIPE = 'unripe',
  PARTIALLY_RIPE = 'partially_ripe',
  RIPE = 'ripe',
  OVERRIPE = 'overripe'
}

export enum VegetableSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum FreshnessLevel {
  VERY_FRESH = 'very_fresh',
  FRESH = 'fresh',
  MODERATELY_FRESH = 'moderately_fresh'
}

export enum AromaQuality {
  STRONG = 'strong',
  MEDIUM = 'medium',
  MILD = 'mild'
}

export enum FragranceQuality {
  STRONG = 'strong',
  MEDIUM = 'medium',
  MILD = 'mild'
}

export class FoodGrainsFilterDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Variety of food grain (e.g., Basmati Rice)' })
  variety?: string;

  @IsOptional()
  @IsEnum(GrainSize)
  @ApiPropertyOptional({ enum: GrainSize, description: 'Size of the grain' })
  grainSize?: GrainSize;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Minimum moisture content percentage' })
  minMoistureContent?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Maximum moisture content percentage' })
  maxMoistureContent?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Maximum foreign matter percentage' })
  maxForeignMatter?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Minimum protein content percentage' })
  minProteinContent?: number;
}

export class OilseedsFilterDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Minimum oil content percentage' })
  minOilContent?: number;

  @IsOptional()
  @IsEnum(SeedSize)
  @ApiPropertyOptional({ enum: SeedSize, description: 'Size of seeds' })
  seedSize?: SeedSize;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Maximum moisture content percentage' })
  maxMoistureContent?: number;
}

export class FruitsFilterDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @ApiPropertyOptional({ description: 'Minimum sweetness level (Brix)' })
  minSweetness?: number;

  @IsOptional()
  @IsEnum(FruitSize)
  @ApiPropertyOptional({ enum: FruitSize, description: 'Size of fruit' })
  size?: FruitSize;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Color of fruit' })
  color?: string;

  @IsOptional()
  @IsEnum(RipenessLevel)
  @ApiPropertyOptional({ enum: RipenessLevel, description: 'Ripeness level' })
  ripenessLevel?: RipenessLevel;
}

export class VegetablesFilterDto {
  @IsOptional()
  @IsEnum(FreshnessLevel)
  @ApiPropertyOptional({ enum: FreshnessLevel, description: 'Freshness level' })
  freshnessLevel?: FreshnessLevel;

  @IsOptional()
  @IsEnum(VegetableSize)
  @ApiPropertyOptional({ enum: VegetableSize, description: 'Size of vegetable' })
  size?: VegetableSize;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Color of vegetable' })
  color?: string;
}

export class SpicesFilterDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Minimum volatile oil content percentage' })
  minVolatileOilContent?: number;

  @IsOptional()
  @IsEnum(AromaQuality)
  @ApiPropertyOptional({ enum: AromaQuality, description: 'Aroma quality' })
  aromaQuality?: AromaQuality;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Minimum purity percentage' })
  minPurity?: number;
}

export class FibersFilterDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @ApiPropertyOptional({ description: 'Minimum staple length in millimeters' })
  minStapleLength?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @ApiPropertyOptional({ description: 'Minimum fiber strength in g/tex' })
  minFiberStrength?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Maximum trash content percentage' })
  maxTrashContent?: number;
}

export class SugarcaneFilterDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Variety of sugarcane (e.g., Co-0238)' })
  variety?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Minimum brix content (sugar percentage)' })
  minBrixContent?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Maximum fiber content percentage' })
  maxFiberContent?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @ApiPropertyOptional({ description: 'Minimum stalk length in centimeters' })
  minStalkLength?: number;
}

export class FlowersFilterDto {
  @IsOptional()
  @IsEnum(FreshnessLevel)
  @ApiPropertyOptional({ enum: FreshnessLevel, description: 'Freshness level' })
  freshnessLevel?: FreshnessLevel;

  @IsOptional()
  @IsEnum(FragranceQuality)
  @ApiPropertyOptional({ enum: FragranceQuality, description: 'Fragrance quality' })
  fragranceQuality?: FragranceQuality;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @ApiPropertyOptional({ description: 'Minimum stem length in centimeters' })
  minStemLength?: number;
}

export class MedicinalPlantsFilterDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Minimum essential oil yield percentage' })
  minEssentialOilYield?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Minimum purity of extracts percentage' })
  minPurityOfExtracts?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Maximum moisture content percentage' })
  maxMoistureContent?: number;
} 