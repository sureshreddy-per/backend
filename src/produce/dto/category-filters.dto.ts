import { IsNumber, IsString, Min, Max, IsOptional, IsIn } from "class-validator";

export class FoodGrainsFilterDto {
  @IsString()
  variety: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  moisture_content: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  foreign_matter: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  protein_content: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  wastage: number;
}

export class OilseedsFilterDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  oil_content: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  moisture_content: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  foreign_matter: number;

  @IsString()
  seed_size: string;

  @IsString()
  seed_color: string;
}

export class FruitsFilterDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  sweetness_brix: number;

  @IsString()
  @IsIn(["small", "medium", "large"])
  size: string;

  @IsString()
  color: string;

  @IsString()
  @IsIn(["ripe", "unripe"])
  ripeness: string;
}

export class VegetablesFilterDto {
  @IsString()
  @IsIn(["fresh", "slightly wilted"])
  freshness_level: string;

  @IsString()
  @IsIn(["small", "medium", "large"])
  size: string;

  @IsString()
  color: string;
}

export class SpicesFilterDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  essential_oil: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  moisture_content: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  foreign_matter: number;

  @IsString()
  aroma_quality: string;

  @IsString()
  color_intensity: string;
}

export class FibersFilterDto {
  @IsNumber()
  @Min(0)
  fiber_length: number;

  @IsNumber()
  @Min(0)
  fiber_strength: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  micronaire: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  uniformity: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  trash_content: number;
}

export class SugarcaneFilterDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  brix_value: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  pol_reading: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  purity: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  fiber_content: number;

  @IsString()
  juice_quality: string;
}

export class FlowersFilterDto {
  @IsString()
  freshness: string;

  @IsString()
  color_intensity: string;

  @IsNumber()
  @Min(0)
  stem_length: number;

  @IsString()
  bud_size: string;

  @IsString()
  fragrance_quality: string;
}

export class MedicinalPlantsFilterDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  active_compounds: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  moisture_content: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  foreign_matter: number;

  @IsString()
  potency: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  purity: number;
}
