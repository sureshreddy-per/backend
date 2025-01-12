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
  constructor(
    configService: ConfigService,
    httpService: HttpService,
  ) {
    super(configService, httpService, OpenAIService.name);
  }

  async analyzeProduceImage(imageUrl: string): Promise<AIAnalysisResult> {
    return this.makeOpenAIRequest<AIAnalysisResult>(
      "gpt-4-vision-preview",
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
                  // Category-specific fields will be included based on the detected category
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
      { max_tokens: 1000 }
    );
  }
}
