import { ProduceCategory } from '../../produce/enums/produce-category.enum';

// Base interface for all category-specific assessments
export interface BaseCategoryAssessment {
  moisture_content?: number;
  foreign_matter?: number;
}

// Food grains specific assessment
export interface FoodGrainsAssessment extends BaseCategoryAssessment {
  protein_content: number;
  broken_grains: number;
}

// Oilseeds specific assessment
export interface OilseedsAssessment extends BaseCategoryAssessment {
  oil_content: number;
}

// Fruits specific assessment
export interface FruitsAssessment {
  ripeness: number;
  brix_content: number;
  color: string;
  size: number;
}

// Vegetables specific assessment
export interface VegetablesAssessment extends BaseCategoryAssessment {
  freshness: number;
  color: string;
}

// Spices specific assessment
export interface SpicesAssessment extends BaseCategoryAssessment {
  oil_content: number;
  aroma: number;
}

// Fibers specific assessment
export interface FibersAssessment {
  staple_length: number;
  fiber_strength: number;
  trash_content: number;
}

// Sugarcane specific assessment
export interface SugarcaneAssessment {
  brix_content: number;
  fiber_content: number;
  stalk_length: number;
}

// Flowers specific assessment
export interface FlowersAssessment {
  freshness: number;
  fragrance: number;
  stem_length: number;
}

// Medicinal plants specific assessment
export interface MedicinalPlantsAssessment extends BaseCategoryAssessment {
  essential_oil_content: number;
  purity: number;
}

// Union type for all possible category-specific assessments
export type CategorySpecificAssessment = 
  | FoodGrainsAssessment
  | OilseedsAssessment
  | FruitsAssessment
  | VegetablesAssessment
  | SpicesAssessment
  | FibersAssessment
  | SugarcaneAssessment
  | FlowersAssessment
  | MedicinalPlantsAssessment; 