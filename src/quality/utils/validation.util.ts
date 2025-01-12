import { ProduceCategory } from "../../produce/enums/produce-category.enum";

interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
}

const REQUIRED_FIELDS_BY_CATEGORY: Record<ProduceCategory, string[]> = {
  [ProduceCategory.FOOD_GRAINS]: ['moisture_content', 'foreign_matter', 'protein_content', 'broken_grains'],
  [ProduceCategory.OILSEEDS]: ['moisture_content', 'oil_content', 'foreign_matter'],
  [ProduceCategory.FRUITS]: ['ripeness', 'brix_content', 'color', 'size'],
  [ProduceCategory.VEGETABLES]: ['moisture_content', 'foreign_matter', 'freshness', 'color'],
  [ProduceCategory.SPICES]: ['moisture_content', 'oil_content', 'foreign_matter', 'aroma'],
  [ProduceCategory.FIBERS]: ['staple_length', 'fiber_strength', 'trash_content'],
  [ProduceCategory.SUGARCANE]: ['brix_content', 'fiber_content', 'stalk_length'],
  [ProduceCategory.FLOWERS]: ['freshness', 'fragrance', 'stem_length'],
  [ProduceCategory.MEDICINAL_PLANTS]: ['moisture_content', 'essential_oil_content', 'purity']
};

export function validateRequiredFields(
  category: ProduceCategory,
  assessment: Record<string, any>
): ValidationResult {
  const requiredFields = REQUIRED_FIELDS_BY_CATEGORY[category] || [];
  const missingFields = requiredFields.filter(field => !assessment || assessment[field] === undefined);

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
} 