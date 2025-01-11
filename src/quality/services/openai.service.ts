import { Injectable } from "@nestjs/common";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { QualityGrade } from "../../produce/enums/quality-grade.enum";
import { FoodGrainsFilterDto } from "../../produce/dto/category-filters.dto";
import { OilseedsFilterDto } from "../../produce/dto/category-filters.dto";
import { FruitsFilterDto } from "../../produce/dto/category-filters.dto";
import { VegetablesFilterDto } from "../../produce/dto/category-filters.dto";
import { SpicesFilterDto } from "../../produce/dto/category-filters.dto";
import { FibersFilterDto } from "../../produce/dto/category-filters.dto";
import { SugarcaneFilterDto } from "../../produce/dto/category-filters.dto";
import { FlowersFilterDto } from "../../produce/dto/category-filters.dto";
import { MedicinalPlantsFilterDto } from "../../produce/dto/category-filters.dto";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";

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
export class OpenAIService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async analyzeProduceImage(imageUrl: string): Promise<AIAnalysisResult> {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    try {
      const response = await this.httpService
        .post(
          apiUrl,
          {
            model: "gpt-4-vision-preview",
            messages: [
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
                    "moisture_content": "number",
                    "foreign_matter": "number",
                    "protein_content": "number",
                    "wastage": "number",

                    // For OILSEEDS:
                    "oil_content": "number",
                    "seed_size": "small|medium|large",
                    "moisture_content": "number",

                    // For FRUITS:
                    "sweetness_brix": "number",
                    "size": "small|medium|large",
                    "color": "string",
                    "ripeness": "ripe|unripe",

                    // For VEGETABLES:
                    "freshness_level": "fresh|slightly wilted",
                    "size": "small|medium|large",
                    "color": "string",

                    // For SPICES:
                    "volatile_oil_content": "number",
                    "aroma_quality": "strong|mild",
                    "purity": "number",

                    // For FIBERS:
                    "staple_length": "number",
                    "fiber_strength": "number",
                    "trash_content": "number",

                    // For SUGARCANE:
                    "variety": "string",
                    "brix_content": "number",
                    "fiber_content": "number",
                    "stalk_length": "number",

                    // For FLOWERS:
                    "freshness_level": "fresh|slightly wilted",
                    "fragrance_quality": "strong|mild",
                    "stem_length": "number",

                    // For MEDICINAL_PLANTS:
                    "essential_oil_yield": "number",
                    "purity_of_extracts": "number",
                    "moisture_content": "number"
                  }
                }`,
                  },
                  {
                    type: "image_url",
                    image_url: imageUrl,
                  },
                ],
              },
            ],
            max_tokens: 1000,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          },
        )
        .toPromise();

      const result = response.data.choices[0].message.content;
      return JSON.parse(result) as AIAnalysisResult;
    } catch (error) {
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }
}
