import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { BaseOpenAIService } from "../../common/services/base-openai.service";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { FoodGrainsFilterDto, OilseedsFilterDto, FruitsFilterDto, VegetablesFilterDto, SpicesFilterDto, FibersFilterDto, SugarcaneFilterDto, FlowersFilterDto, MedicinalPlantsFilterDto } from "../../produce/dto/category-filters.dto";

export interface AIAnalysisResult {
  name: string;
  produce_category: ProduceCategory;
  product_variety: string;
  description: string;
  quality_grade: number;
  confidence_level: number;
  detected_defects: string[];
  recommendations: string[];
  category_specific_attributes:
    | FoodGrainsFilterDto
    | OilseedsFilterDto
    | FruitsFilterDto
    | VegetablesFilterDto
    | SpicesFilterDto
    | FibersFilterDto
    | SugarcaneFilterDto
    | FlowersFilterDto
    | MedicinalPlantsFilterDto;
}

@Injectable()
export class OpenAIService extends BaseOpenAIService {
  private readonly visionModel: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly enableAIFeatures: boolean;

  constructor(
    configService: ConfigService,
    httpService: HttpService,
  ) {
    super(configService, httpService, OpenAIService.name);

    // Load configuration from environment variables
    this.visionModel = configService.get<string>('OPENAI_MODEL') || 'gpt-4-vision-preview';
    this.temperature = configService.get<number>('OPENAI_TEMPERATURE') || 0.7;
    this.maxTokens = configService.get<number>('OPENAI_MAX_TOKENS') || 2000;
    this.enableAIFeatures = configService.get<boolean>('ENABLE_AI_FEATURES') || false;
  }

  async analyzeProduceImage(imageUrl: string): Promise<AIAnalysisResult> {
    // Check if AI features are enabled
    if (!this.enableAIFeatures) {
      throw new Error('AI features are disabled in the current environment');
    }

    return this.makeOpenAIRequest<AIAnalysisResult>(
      this.visionModel,
      [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this agricultural produce image and provide a detailed assessment in the following JSON format:
              {
                "name": "produce name",
                "produce_category": "one of [FOOD_GRAINS, OILSEEDS, FRUITS, VEGETABLES, SPICES, FIBERS, SUGARCANE, FLOWERS, MEDICINAL_PLANTS]",
                "product_variety": "specific variety name",
                "description": "detailed description",
                "quality_grade": "number between 1-10",
                "confidence_level": "number between 0-100",
                "detected_defects": ["list of defects"],
                "recommendations": ["list of recommendations"],
                "category_specific_attributes": {
                  // For FOOD_GRAINS:
                  "variety": "string",
                  "moisture_content": "number (0-100)",
                  "foreign_matter": "number (0-100)",
                  "protein_content": "number (0-100)",
                  "wastage": "number (0-100)",

                  // For OILSEEDS:
                  "oil_content": "number (0-100)",
                  "moisture_content": "number (0-100)",
                  "foreign_matter": "number (0-100)",
                  "seed_size": "string",
                  "seed_color": "string",

                  // For FRUITS:
                  "sweetness_brix": "number (0-100)",
                  "size": "string (small/medium/large)",
                  "color": "string",
                  "ripeness": "string (ripe/unripe)",

                  // For VEGETABLES:
                  "freshness_level": "string (fresh/slightly wilted)",
                  "size": "string (small/medium/large)",
                  "color": "string",
                  "moisture_content": "number (0-100)",
                  "foreign_matter": "number (0-100)",

                  // For SPICES:
                  "essential_oil": "number (0-100)",
                  "moisture_content": "number (0-100)",
                  "foreign_matter": "number (0-100)",
                  "aroma_quality": "string",
                  "color_intensity": "string",

                  // For FIBERS:
                  "fiber_length": "number (min: 0)",
                  "fiber_strength": "number (min: 0)",
                  "micronaire": "number (0-10)",
                  "uniformity": "number (0-100)",
                  "trash_content": "number (0-100)",

                  // For SUGARCANE:
                  "brix_value": "number (0-100)",
                  "pol_reading": "number (0-100)",
                  "purity": "number (0-100)",
                  "fiber_content": "number (0-100)",
                  "juice_quality": "string",

                  // For FLOWERS:
                  "freshness": "string",
                  "color_intensity": "string",
                  "stem_length": "number (min: 0)",
                  "bud_size": "string",
                  "fragrance_quality": "string",

                  // For MEDICINAL_PLANTS:
                  "active_compounds": "number (0-100)",
                  "moisture_content": "number (0-100)",
                  "foreign_matter": "number (0-100)",
                  "potency": "string",
                  "purity": "number (0-100)"
                }
              }
              
              Important notes:
              1. Include ONLY the category-specific attributes that match the detected produce_category
              2. All numeric values should be within their specified ranges
              3. String enums must match exactly as specified (e.g., "fresh"/"slightly wilted" for vegetables freshness_level)
              4. All required fields for the detected category must be included`,
            },
            {
              type: "image_url",
              image_url: imageUrl,
            },
          ],
        },
      ],
      {
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      }
    );
  }

  // Add method to check API key validity
  async checkAPIKeyValidity(): Promise<boolean> {
    try {
      await this.makeOpenAIRequest(
        this.visionModel,
        [{ role: "user", content: "Test message" }],
        { max_tokens: 5 }
      );
      return true;
    } catch (error) {
      console.error('OpenAI API key validation failed:', error.message);
      return false;
    }
  }

  // Add method to get current configuration
  getConfiguration() {
    return {
      model: this.visionModel,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      aiEnabled: this.enableAIFeatures,
    };
  }
}
