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
      freshness_level: this.getRandomElement(["fresh", "slightly wilted"]),
      size: this.getRandomElement(["small", "medium", "large"]),
      color: this.getRandomElement(["red", "green", "yellow"])
    };
  }

  private getFruitsAttributes(): FruitsFilterDto {
    return {
      sweetness_brix: this.getRandomNumber(8, 20),
      size: this.getRandomElement(["small", "medium", "large"]),
      color: this.getRandomElement(["red", "yellow", "orange"]),
      ripeness: this.getRandomElement(["ripe", "unripe"])
    };
  }

  private getFoodGrainsAttributes(): FoodGrainsFilterDto {
    return {
      variety: this.getRandomElement(["Basmati", "Jasmine", "Brown"]),
      moisture_content: this.getRandomNumber(10, 14),
      foreign_matter: this.getRandomNumber(0, 2),
      protein_content: this.getRandomNumber(6, 12),
      wastage: this.getRandomNumber(0, 5)
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
        defects: ["slight discoloration", "minor blemishes", "uneven size"],
        recommendations: ["store in cool place", "consume within a week", "check for freshness"],
        getAttributes: () => this.getVegetablesAttributes()
      },
      {
        category: ProduceCategory.FRUITS,
        names: ["Apples", "Mangoes", "Bananas", "Oranges"],
        varieties: ["Fresh", "Organic", "Premium", "Local"],
        defects: ["minor bruising", "uneven ripeness", "surface marks"],
        recommendations: ["ripen at room temperature", "store in cool place", "check ripeness"],
        getAttributes: () => this.getFruitsAttributes()
      },
      {
        category: ProduceCategory.FOOD_GRAINS,
        names: ["Rice", "Wheat", "Barley", "Oats"],
        varieties: ["Premium", "Organic", "Standard", "Export"],
        defects: ["moisture variation", "foreign matter presence", "broken grains"],
        recommendations: ["store in dry place", "check moisture level", "proper packaging"],
        getAttributes: () => this.getFoodGrainsAttributes()
      }
    ];

    // Randomly select a produce type
    const produceType = this.getRandomElement(produceTypes);

    return {
      name: this.getRandomElement(produceType.names),
      produce_category: produceType.category,
      product_variety: this.getRandomElement(produceType.varieties),
      description: `High quality ${produceType.category.toLowerCase()} in good condition`,
      quality_grade: this.getRandomNumber(6, 9),
      confidence_level: this.getRandomNumber(75, 95),
      detected_defects: [this.getRandomElement(produceType.defects)],
      recommendations: [this.getRandomElement(produceType.recommendations)],
      category_specific_attributes: produceType.getAttributes()
    };
  }
} 