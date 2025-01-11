export interface CategorySpecificAssessment {
  // Food Grains
  variety?: string;
  moisture_content?: number;
  foreign_matter?: number;
  protein_content?: number;
  wastage?: number;

  // Oilseeds
  oil_content?: number;
  seed_size?: number;

  // Fruits & Vegetables
  sweetness_brix?: number;
  size?: string;
  color?: string;
  ripeness?: string;
  freshness_level?: number;

  // Spices
  volatile_oil_content?: number;
  aroma_quality?: number;
  purity?: number;

  // Fibers
  staple_length?: number;
  fiber_strength?: number;
  trash_content?: number;

  // Sugarcane
  brix_content?: number;
  fiber_content?: number;
  stalk_length?: number;

  // Flowers
  fragrance_quality?: number;
  stem_length?: number;

  // Medicinal Plants
  essential_oil_yield?: number;
  purity_of_extracts?: number;
} 