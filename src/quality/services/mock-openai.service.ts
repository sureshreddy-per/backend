import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { OpenAIService, AIAnalysisResult, ImageData } from './openai.service';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';
import { QualityAssessmentService } from '../../quality/services/quality-assessment.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';

@Injectable()
export class MockOpenAIService extends OpenAIService {
  constructor(
    configService: ConfigService,
    httpService: HttpService,
    qualityAssessmentService: QualityAssessmentService,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>
  ) {
    super(configService, httpService, qualityAssessmentService);
  }

  async analyzeProduceWithMultipleImages(images: ImageData[], produceId: string): Promise<AIAnalysisResult> {
    // Get produce details first
    const produce = await this.produceRepository.findOne({
      where: { id: produceId }
    });

    if (!produce) {
      throw new NotFoundException(`Produce with ID ${produceId} not found`);
    }

    await this.qualityAssessmentService.create({
      produce_id: produceId,
      produce_name: produce.name,
      category: produce.produce_category,
      quality_grade: 8,
      confidence_level: 85,
      defects: ['minor discoloration', 'slight size variation'],
      recommendations: ['Store in a cool, dry place', 'Handle with care during transport'],
      category_specific_assessment: {
        size: 'medium',
        color: 'vibrant'
      },
      metadata: {
        source: 'AI',
        ai_model_version: 'mock-1.0',
        analysis_date: new Date().toISOString()
      }
    });

    // Mock implementation
    const mockResult: AIAnalysisResult = {
      name: produce.name,
      produce_category: produce.produce_category,
      product_variety: produce.product_variety || 'Standard',
      description: produce.description || 'Standard quality produce',
      quality_grade: 8,
      confidence_level: 85,
      detected_defects: ['minor discoloration', 'slight size variation'],
      recommendations: ['Store in a cool, dry place', 'Handle with care during transport'],
      category_specific_attributes: {
        size: 'medium',
        color: 'vibrant'
      }
    };

    return mockResult;
  }
} 