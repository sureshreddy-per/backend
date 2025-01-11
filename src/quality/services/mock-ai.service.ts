import { Injectable, Logger } from "@nestjs/common";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { AIAnalysisResult } from "./openai.service";
import { 
  FoodGrainsFilterDto,
  VegetablesFilterDto,
  FruitsFilterDto,
} from "../../produce/dto/category-filters.dto";

@Injectable()
export class MockAIService {
  private readonly logger = new Logger(MockAIService.name);

  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getVegetablesAttributes(): VegetablesFilterDto {
    return {
      freshness: "excellent",
      size: "medium",
      color: "bright",
      firmness: "firm",
      pest_damage: this.getRandomNumber(0, 20)
    };
  }

  private getFruitsAttributes(): FruitsFilterDto {
    return {
      ripeness: "good",
      size: "medium",
      color: "vibrant",
      brix_value: this.getRandomNumber(10, 20),
      skin_condition: "smooth",
      sweetness: "medium"
    };
  }

  private getFoodGrainsAttributes(): FoodGrainsFilterDto {
    return {
      moisture_content: this.getRandomNumber(10, 15),
      foreign_matter: this.getRandomNumber(0, 2),
      broken_grains: this.getRandomNumber(0, 5),
      weeviled_grains: this.getRandomNumber(0, 2),
      grain_size: "medium",
      grain_color: "golden"
    };
  }

  async analyzeProduceImage(imageUrl: string): Promise<AIAnalysisResult> {
    this.logger.log(`Mock AI analyzing image: ${imageUrl}`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Random produce categories and their attributes
    const produceTypes = [
      {
        category: ProduceCategory.VEGETABLES,
        names: ["Tomatoes", "Potatoes", "Carrots", "Onions"],
        varieties: ["Fresh", "Organic", "Premium", "Local"],
        defects: ["minor_blemishes", "slight_discoloration", "size_variation"],
        recommendations: ["store_in_cool_place", "consume_within_week", "check_ripeness"],
        getAttributes: () => this.getVegetablesAttributes()
      },
      {
        category: ProduceCategory.FRUITS,
        names: ["Apples", "Mangoes", "Bananas", "Oranges"],
        varieties: ["Fresh", "Organic", "Premium", "Local"],
        defects: ["minor_bruising", "ripeness_variation", "surface_marks"],
        recommendations: ["ripen_at_room_temp", "store_in_cool_place", "check_ripeness"],
        getAttributes: () => this.getFruitsAttributes()
      },
      {
        category: ProduceCategory.FOOD_GRAINS,
        names: ["Rice", "Wheat", "Barley", "Oats"],
        varieties: ["Premium", "Organic", "Standard", "Export"],
        defects: ["moisture_variation", "foreign_matter", "broken_grains"],
        recommendations: ["store_in_dry_place", "check_moisture", "proper_packaging"],
        getAttributes: () => this.getFoodGrainsAttributes()
      }
    ];

    // Randomly select a produce type
    const produceType = this.getRandomElement(produceTypes);

    // Randomly decide if confidence should be high or low
    const highConfidence = Math.random() > 0.2; // 80% chance of high confidence

    return {
      name: this.getRandomElement(produceType.names),
      produce_category: produceType.category,
      product_variety: this.getRandomElement(produceType.varieties),
      description: `Fresh ${produceType.category.toLowerCase()} in good condition`,
      quality_grade: this.getRandomNumber(6, 9),
      confidence_level: highConfidence ? this.getRandomNumber(80, 95) : this.getRandomNumber(50, 75),
      detected_defects: [this.getRandomElement(produceType.defects)],
      recommendations: [this.getRandomElement(produceType.recommendations)],
      category_specific_attributes: produceType.getAttributes()
    };
  }
} 