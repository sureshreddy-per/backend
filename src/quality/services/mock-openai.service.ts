import { Injectable } from "@nestjs/common";
import { OpenAIService } from "./openai.service";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class MockOpenAIService extends OpenAIService {
  constructor(
    configService: ConfigService,
    httpService: HttpService,
  ) {
    super(configService, httpService);
  }

  async analyzeProduceImage(imageUrl: string): Promise<any> {
    // Mock response for tomatoes (VEGETABLES)
    if (imageUrl.includes("tomato")) {
      return {
        name: "Tomato",
        produce_category: ProduceCategory.VEGETABLES,
        product_variety: "Roma Tomatoes",
        description: "Fresh, ripe tomatoes with vibrant red color",
        quality_grade: 8,
        confidence_level: 90,
        detected_defects: ["minor_bruising"],
        recommendations: ["Store in cool temperature", "Handle with care during transport"],
        category_specific_attributes: {
          freshness_level: "fresh",
          size: "medium",
          color: "deep red",
          moisture_content: 85,
          foreign_matter: 0.5
        }
      };
    }

    // Mock response for potatoes (VEGETABLES)
    if (imageUrl.includes("potato")) {
      return {
        name: "Potato",
        produce_category: ProduceCategory.VEGETABLES,
        product_variety: "Russet Potatoes",
        description: "Clean potatoes with minimal blemishes",
        quality_grade: 8,
        confidence_level: 85,
        detected_defects: ["slight_discoloration"],
        recommendations: ["Store in dark, cool place", "Avoid exposure to light"],
        category_specific_attributes: {
          freshness_level: "fresh",
          size: "medium",
          color: "brown",
          moisture_content: 78,
          foreign_matter: 0.3
        }
      };
    }

    // Mock response for rice (FOOD_GRAINS)
    if (imageUrl.includes("rice")) {
      return {
        name: "Rice",
        produce_category: ProduceCategory.FOOD_GRAINS,
        product_variety: "Basmati Rice",
        description: "Premium quality long-grain rice",
        quality_grade: 9,
        confidence_level: 95,
        detected_defects: ["minimal_broken_grains"],
        recommendations: ["Store in airtight container", "Keep away from moisture"],
        category_specific_attributes: {
          moisture_content: 12,
          foreign_matter: 0.2,
          protein_content: 8.5,
          broken_grains: 2
        }
      };
    }

    // Mock response for sunflower seeds (OILSEEDS)
    if (imageUrl.includes("sunflower")) {
      return {
        name: "Sunflower Seeds",
        produce_category: ProduceCategory.OILSEEDS,
        product_variety: "Black Oil Sunflower Seeds",
        description: "High-quality sunflower seeds for oil extraction",
        quality_grade: 8,
        confidence_level: 88,
        detected_defects: ["minor_shell_damage"],
        recommendations: ["Store in cool, dry place", "Monitor moisture levels"],
        category_specific_attributes: {
          moisture_content: 7,
          oil_content: 45,
          foreign_matter: 0.3
        }
      };
    }

    // Mock response for apples (FRUITS)
    if (imageUrl.includes("apple")) {
      return {
        name: "Apple",
        produce_category: ProduceCategory.FRUITS,
        product_variety: "Red Delicious",
        description: "Fresh, sweet apples with bright red color",
        quality_grade: 9,
        confidence_level: 92,
        detected_defects: ["minor_surface_scratches"],
        recommendations: ["Store in refrigerator", "Handle gently to prevent bruising"],
        category_specific_attributes: {
          ripeness: "ripe",
          brix_content: 14,
          color: "bright red",
          size: "medium"
        }
      };
    }

    // Mock response for cardamom (SPICES)
    if (imageUrl.includes("cardamom")) {
      return {
        name: "Cardamom",
        produce_category: ProduceCategory.SPICES,
        product_variety: "Green Cardamom",
        description: "Premium quality green cardamom pods",
        quality_grade: 9,
        confidence_level: 90,
        detected_defects: ["slight_color_variation"],
        recommendations: ["Store in airtight container", "Keep away from direct sunlight"],
        category_specific_attributes: {
          moisture_content: 11,
          oil_content: 8,
          foreign_matter: 0.2,
          aroma: "excellent"
        }
      };
    }

    // Mock response for cotton (FIBERS)
    if (imageUrl.includes("cotton")) {
      return {
        name: "Cotton",
        produce_category: ProduceCategory.FIBERS,
        product_variety: "Upland Cotton",
        description: "High-quality cotton fibers",
        quality_grade: 8,
        confidence_level: 87,
        detected_defects: ["minor_color_variation"],
        recommendations: ["Store in dry conditions", "Protect from contamination"],
        category_specific_attributes: {
          staple_length: 28,
          fiber_strength: 30,
          trash_content: 1.5
        }
      };
    }

    // Mock response for sugarcane (SUGARCANE)
    if (imageUrl.includes("sugarcane")) {
      return {
        name: "Sugarcane",
        produce_category: ProduceCategory.SUGARCANE,
        product_variety: "Co 86032",
        description: "Fresh sugarcane stalks with good juice content",
        quality_grade: 8,
        confidence_level: 85,
        detected_defects: ["minor_stalk_damage"],
        recommendations: ["Process within 24 hours", "Protect from sun exposure"],
        category_specific_attributes: {
          brix_content: 18,
          fiber_content: 12,
          stalk_length: 200
        }
      };
    }

    // Mock response for roses (FLOWERS)
    if (imageUrl.includes("rose")) {
      return {
        name: "Rose",
        produce_category: ProduceCategory.FLOWERS,
        product_variety: "Red Roses",
        description: "Fresh cut roses with vibrant color",
        quality_grade: 9,
        confidence_level: 93,
        detected_defects: ["slight_petal_damage"],
        recommendations: ["Keep in cool water", "Trim stems regularly"],
        category_specific_attributes: {
          freshness: "very fresh",
          fragrance: "strong",
          stem_length: 50
        }
      };
    }

    // Mock response for tulsi (MEDICINAL_PLANTS)
    if (imageUrl.includes("tulsi")) {
      return {
        name: "Tulsi",
        produce_category: ProduceCategory.MEDICINAL_PLANTS,
        product_variety: "Holy Basil",
        description: "Fresh tulsi leaves with strong aroma",
        quality_grade: 9,
        confidence_level: 88,
        detected_defects: ["minor_leaf_damage"],
        recommendations: ["Process quickly", "Store in cool conditions"],
        category_specific_attributes: {
          moisture_content: 65,
          essential_oil_content: 2.5,
          purity: 98
        }
      };
    }

    // Default response for unknown images
    return {
      name: "Unknown Produce",
      produce_category: ProduceCategory.VEGETABLES,
      product_variety: "Unknown",
      description: "Unable to determine specific details",
      quality_grade: 5,
      confidence_level: 30,
      detected_defects: ["unknown"],
      recommendations: ["Manual inspection required"],
      category_specific_attributes: {
        freshness_level: "slightly wilted",
        size: "medium",
        color: "unknown",
        moisture_content: 50,
        foreign_matter: 1
      }
    };
  }
} 