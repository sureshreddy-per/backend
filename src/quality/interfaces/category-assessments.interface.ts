export interface FoodGrainsAssessment {
  variety: string;
  moisture_content: number;
  foreign_matter: number;
  protein_content: number;
  wastage: number;
}

export interface OilseedsAssessment {
  oil_content: number;
  seed_size: "small" | "medium" | "large";
  moisture_content: number;
}

export interface FruitsAssessment {
  sweetness_brix: number;
  size: "small" | "medium" | "large";
  color: string;
  ripeness: "ripe" | "unripe";
}

export interface VegetablesAssessment {
  freshness_level: "fresh" | "slightly wilted";
  size: "small" | "medium" | "large";
  color: string;
}

export interface SpicesAssessment {
  volatile_oil_content: number;
  aroma_quality: "strong" | "mild";
  purity: number;
}

export interface FibersAssessment {
  staple_length: number;
  fiber_strength: number;
  trash_content: number;
}

export interface SugarcaneAssessment {
  variety: string;
  brix_content: number;
  fiber_content: number;
  stalk_length: number;
}

export interface FlowersAssessment {
  freshness_level: "fresh" | "slightly wilted";
  fragrance_quality: "strong" | "mild";
  stem_length: number;
}

export interface MedicinalPlantsAssessment {
  essential_oil_yield: number;
  purity_of_extracts: number;
  moisture_content: number;
}

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
