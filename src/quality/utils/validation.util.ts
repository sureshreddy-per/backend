import { BadRequestException } from "@nestjs/common";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { CategorySpecificAssessment } from "../interfaces/category-specific-assessment.interface";

export const REQUIRED_FIELDS: Readonly<Record<ProduceCategory, readonly string[]>> = Object.freeze({
  [ProduceCategory.FOOD_GRAINS]: Object.freeze([
    "variety",
    "moisture_content",
    "foreign_matter",
    "protein_content",
    "wastage",
  ]),
  [ProduceCategory.OILSEEDS]: Object.freeze([
    "oil_content",
    "seed_size",
    "moisture_content",
  ]),
  [ProduceCategory.FRUITS]: Object.freeze(["sweetness_brix", "size", "color", "ripeness"]),
  [ProduceCategory.VEGETABLES]: Object.freeze(["freshness_level", "size", "color"]),
  [ProduceCategory.SPICES]: Object.freeze([
    "volatile_oil_content",
    "aroma_quality",
    "purity",
  ]),
  [ProduceCategory.FIBERS]: Object.freeze([
    "staple_length",
    "fiber_strength",
    "trash_content",
  ]),
  [ProduceCategory.SUGARCANE]: Object.freeze([
    "variety",
    "brix_content",
    "fiber_content",
    "stalk_length",
  ]),
  [ProduceCategory.FLOWERS]: Object.freeze([
    "freshness_level",
    "fragrance_quality",
    "stem_length",
  ]),
  [ProduceCategory.MEDICINAL_PLANTS]: Object.freeze([
    "essential_oil_yield",
    "purity_of_extracts",
    "moisture_content",
  ]),
});

export function validateCategorySpecificAssessment(
  category: ProduceCategory,
  assessment: CategorySpecificAssessment,
): void {
  const required = REQUIRED_FIELDS[category];
  if (!required) {
    throw new BadRequestException(`Invalid produce category: ${category}`);
  }

  const assessmentFields = new Set(Object.keys(assessment));
  const missing = required.filter(field => !assessmentFields.has(field));
  if (missing.length > 0) {
    throw new BadRequestException(
      `Missing required fields for ${category}: ${missing.join(", ")}`,
    );
  }
}

export function validateQualityGrade(grade: number): void {
  if (grade < 1 || grade > 5) {
    throw new BadRequestException("Quality grade must be between 1 and 5");
  }
} 