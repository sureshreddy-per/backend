import { Injectable, Logger, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { OpenAIService, AIAnalysisResult } from "./openai.service";
import { OnEvent } from "@nestjs/event-emitter";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { QualityAssessmentService } from "./quality-assessment.service";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { CategorySpecificAssessment } from "../interfaces/category-specific-assessment.interface";
import { CreateQualityAssessmentDto } from "../dto/create-quality-assessment.dto";

interface AIAssessmentMetadata {
  source: 'AI_ASSESSMENT';
  ai_model_version: string;
  assessment_parameters: {
    name: string;
    product_variety: string;
    description: string;
  };
  location: string;
  images: string[];
}

@Injectable()
export class AIInspectionService {
  private readonly logger = new Logger(AIInspectionService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly qualityAssessmentService: QualityAssessmentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('produce.created')
  async handleProduceCreated(event: { produce_id: string; image_url: string; location: string }) {
    this.logger.log(`Received produce.created event for produce ${event.produce_id}`);
    
    try {
      // Validate input
      if (!event.image_url) {
        throw new BadRequestException('Image URL is required for AI assessment');
      }

      // Analyze image using OpenAI
      const analysis = await this.openaiService.analyzeProduceImage(event.image_url)
        .catch(error => {
          this.logger.error(`OpenAI analysis failed: ${error.message}`);
          throw new InternalServerErrorException('AI analysis failed', error.message);
        });
      
      // Create quality assessment from AI results
      const assessmentData: CreateQualityAssessmentDto = {
        produce_id: event.produce_id,
        quality_grade: analysis.quality_grade,
        confidence_level: analysis.confidence_level,
        defects: analysis.detected_defects,
        recommendations: analysis.recommendations,
        category_specific_assessment: analysis.category_specific_attributes as CategorySpecificAssessment,
        metadata: {
          source: 'AI_ASSESSMENT',
          ai_model_version: "gpt-4-vision-preview",
          assessment_parameters: {
            name: analysis.name,
            product_variety: analysis.product_variety,
            description: analysis.description
          },
          location: event.location,
          images: [event.image_url]
        } as AIAssessmentMetadata
      };

      const assessment = await this.qualityAssessmentService.create(assessmentData)
        .catch(error => {
          this.logger.error(`Failed to create quality assessment: ${error.message}`);
          throw new InternalServerErrorException('Failed to save assessment', error.message);
        });
      
      this.logger.log(`Created AI assessment for produce ${event.produce_id}`);
      
      // Emit success event
      await this.eventEmitter.emit('quality.assessment.completed', {
        produce_id: event.produce_id,
        assessment_id: assessment.id,
        source: 'AI_ASSESSMENT'
      });
      
      return assessment;
      
    } catch (error) {
      this.logger.error(`Failed to process AI assessment for produce ${event.produce_id}: ${error.message}`);
      
      // Update produce status to indicate failed assessment
      await this.eventEmitter.emit('produce.status.update', {
        produce_id: event.produce_id,
        status: 'ASSESSMENT_FAILED',
        error: error.message,
        source: 'AI_ASSESSMENT'
      });
      
      throw error;
    }
  }
}
