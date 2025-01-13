import { Injectable } from "@nestjs/common";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";

@Injectable()
export class MockOpenAIService {
  async analyzeProduceImage(imageUrl: string) {
    // Mock response for tomatoes
    return {
      name: "Tomatoes",
      produce_category: ProduceCategory.VEGETABLES,
      product_variety: "Roma",
      description: "Fresh ripe tomatoes with good color and minimal defects",
      quality_grade: 8,
      confidence_level: 90,
      detected_defects: ["minor_bruising"],
      recommendations: ["Store in cool temperature"],
      category_specific_attributes: {
        freshness_level: "fresh",
        size: "medium",
        color: "red",
        moisture_content: 85,
        foreign_matter: 0.5
      }
    };
  }
} 