import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';
import { firstValueFrom } from 'rxjs';

export interface AIAnalysisResult {
  name: string;
  produce_category: ProduceCategory;
  product_variety: string;
  description: string;
  quality_grade: number;
  confidence_level: number;
  detected_defects: string[];
  recommendations: string[];
  category_specific_attributes: Record<string, any>;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly apiKey: string;
  private readonly apiEndpoint: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.apiEndpoint = this.configService.get<string>('OPENAI_API_ENDPOINT', 'https://api.openai.com/v1/chat/completions');
  }

  async analyzeProduceImage(fileBuffer: Buffer, mimeType: string): Promise<AIAnalysisResult> {
    try {
      const base64Image = fileBuffer.toString('base64');
      const response = await firstValueFrom(
        this.httpService.post(
          this.apiEndpoint,
          {
            model: 'gpt-4-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Analyze this agricultural produce image and provide details about its quality, category, and characteristics. Format the response as a JSON object with the following structure: name, produce_category (from enum: VEGETABLES, FRUITS, FOOD_GRAINS, OILSEEDS, SPICES, FIBERS, SUGARCANE, FLOWERS, MEDICINAL_PLANTS), product_variety, description, quality_grade (1-10), confidence_level (1-100), detected_defects (array), recommendations (array), and category_specific_attributes (object with relevant metrics).',
                  },
                  {
                    type: 'image',
                    image_url: {
                      url: `data:${mimeType};base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 1000,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
          },
        ),
      );

      const content = response.data.choices[0].message.content;
      const result = JSON.parse(content);

      // Validate and transform the response
      return {
        name: result.name || 'Unknown',
        produce_category: result.produce_category || ProduceCategory.VEGETABLES,
        product_variety: result.product_variety || 'Unknown',
        description: result.description || '',
        quality_grade: Math.min(Math.max(result.quality_grade || 5, 1), 10),
        confidence_level: Math.min(Math.max(result.confidence_level || 50, 1), 100),
        detected_defects: Array.isArray(result.detected_defects) ? result.detected_defects : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
        category_specific_attributes: result.category_specific_attributes || {},
      };
    } catch (error) {
      this.logger.error(`Error analyzing produce image: ${error.message}`, error.stack);
      throw error;
    }
  }
}
