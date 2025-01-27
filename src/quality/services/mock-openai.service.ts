import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { OpenAIService, AIAnalysisResult, ImageData } from './openai.service';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';
import { QualityAssessmentService } from '../../quality/services/quality-assessment.service';

@Injectable()
export class MockOpenAIService extends OpenAIService {
  constructor(
    configService: ConfigService,
    httpService: HttpService,
    qualityAssessmentService: QualityAssessmentService
  ) {
    super(configService, httpService, qualityAssessmentService);
  }

  async analyzeProduceWithMultipleImages(images: ImageData[], produceId: string): Promise<AIAnalysisResult> {
    // Mock implementation
    const mockResult = {
      name: 'Mock Produce',
      produce_category: ProduceCategory.VEGETABLES,
      product_variety: 'Mock Variety',
      description: 'This is a mock produce description',
      quality_grade: 8,
      confidence_level: 90,
      detected_defects: ['Mock defect 1', 'Mock defect 2'],
      recommendations: ['Mock recommendation 1', 'Mock recommendation 2'],
      category_specific_attributes: {
        size: 'medium',
        color: 'green'
      }
    };

    // Store the mock assessment
    await this.qualityAssessmentService.create({
      produce_id: produceId,
      quality_grade: mockResult.quality_grade,
      confidence_level: mockResult.confidence_level,
      defects: mockResult.detected_defects,
      recommendations: mockResult.recommendations,
      category_specific_assessment: mockResult.category_specific_attributes,
      metadata: {
        source: 'MOCK_AI_ASSESSMENT',
        ai_model_version: 'mock-1.0',
        analysis_date: new Date().toISOString()
      }
    });

    return mockResult;
  }
} 