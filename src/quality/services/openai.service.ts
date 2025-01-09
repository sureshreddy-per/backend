import { Injectable } from '@nestjs/common';
import { ProduceCategory } from '../../produce/entities/produce.entity';
import { QualityGrade } from '../../produce/enums/quality-grade.enum';
import { FoodGrainsFilterDto } from '../../produce/dto/category-filters.dto';
import { OilseedsFilterDto } from '../../produce/dto/category-filters.dto';
import { FruitsFilterDto } from '../../produce/dto/category-filters.dto';
import { VegetablesFilterDto } from '../../produce/dto/category-filters.dto';
import { SpicesFilterDto } from '../../produce/dto/category-filters.dto';
import { FibersFilterDto } from '../../produce/dto/category-filters.dto';
import { SugarcaneFilterDto } from '../../produce/dto/category-filters.dto';
import { FlowersFilterDto } from '../../produce/dto/category-filters.dto';
import { MedicinalPlantsFilterDto } from '../../produce/dto/category-filters.dto';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

export interface AIAnalysisResult {
  name: string;
  produce_category: ProduceCategory;
  product_variety: string;
  description: string;
  quality_grade: number;
  confidence_level: number;
  detected_defects: string[];
  recommendations: string[];
  category_specific_attributes: FoodGrainsFilterDto | OilseedsFilterDto | FruitsFilterDto | VegetablesFilterDto | SpicesFilterDto | FibersFilterDto | SugarcaneFilterDto | FlowersFilterDto | MedicinalPlantsFilterDto;
}

@Injectable()
export class OpenAIService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {}

  async analyzeProduceImage(imageUrl: string): Promise<AIAnalysisResult> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    try {
      const response = await this.httpService.post(apiUrl, {
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
                  "produce_category": "one of [FOOD_GRAINS, OILSEEDS, FRUITS, VEGETABLES, SPICES, FIBERS, SUGARCANE, FLOWERS, MEDICINAL]",
                  "product_variety": "specific variety name",
                  "description": "detailed description",
                  "quality_grade": "number between 1-10",
                  "confidence_level": "number between 0-100",
                  "detected_defects": ["list of defects"],
                  "recommendations": ["list of recommendations"],
                  "category_specific_attributes": {
                    // For FOOD_GRAINS:
                    "moisture_content": "number",
                    "foreign_matter": "number",
                    "broken_grains": "number",
                    "grain_size": "string",

                    // For OILSEEDS:
                    "oil_content": "number",
                    "moisture_level": "number",
                    "seed_size": "string",

                    // For FRUITS/VEGETABLES:
                    "ripeness": "string",
                    "freshness": "string",
                    "color_uniformity": "number",
                    "size_uniformity": "number",

                    // For SPICES:
                    "aroma_strength": "number",
                    "color_intensity": "number",
                    "essential_oil": "number",

                    // For FIBERS:
                    "fiber_length": "number",
                    "fiber_strength": "number",
                    "fiber_uniformity": "number",

                    // For SUGARCANE:
                    "sugar_content": "number",
                    "stalk_length": "number",
                    "maturity": "string",

                    // For FLOWERS:
                    "bloom_stage": "string",
                    "stem_length": "number",
                    "color_vibrancy": "number",

                    // For MEDICINAL:
                    "active_compounds": "number",
                    "plant_maturity": "string",
                    "therapeutic_grade": "number"
                  }
                }`
              },
              {
                type: "image_url",
                image_url: imageUrl
              }
            ]
          }
        ],
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }).toPromise();

      const result = response.data.choices[0].message.content;
      return JSON.parse(result) as AIAnalysisResult;
    } catch (error) {
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }
}