import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { OpenAIService, AIAnalysisResult, ImageData } from './openai.service';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';

@Injectable()
export class MockOpenAIService extends OpenAIService {
  constructor(
    configService: ConfigService,
    httpService: HttpService,
  ) {
    super(configService, httpService);
  }

  async analyzeProduceWithMultipleImages(images: ImageData[]): Promise<AIAnalysisResult> {
    // Mock implementation for testing
    return {
      name: 'Mock Tomato',
      produce_category: ProduceCategory.VEGETABLES,
      product_variety: 'Roma',
      description: 'Fresh red tomatoes',
      quality_grade: 8,
      confidence_level: 90,
      detected_defects: [],
      recommendations: ['Store in cool place'],
      category_specific_attributes: {
        freshness_level: 'fresh',
        size: 'medium',
        color: 'red',
        moisture_content: 85,
        foreign_matter: 0,
      },
    };
  }
} 