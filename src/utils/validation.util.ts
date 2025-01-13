import { ProduceCategory } from "../produce/enums/produce-category.enum";

interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
}

export function validateRequiredFields(category: ProduceCategory, assessment: any): ValidationResult {
  const requiredFields = getRequiredFieldsByCategory(category);
  const missingFields = requiredFields.filter(field => !assessment || assessment[field] === undefined);
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

function getRequiredFieldsByCategory(category: ProduceCategory): string[] {
  switch (category) {
    case ProduceCategory.VEGETABLES:
      return ['freshness_level', 'size', 'color', 'moisture_content', 'foreign_matter'];
    case ProduceCategory.FRUITS:
      return ['ripeness', 'size', 'color', 'sugar_content'];
    default:
      return [];
  }
}

export function isValidQualityGrade(grade: number): boolean {
  return grade >= 0 && grade <= 10;
} 