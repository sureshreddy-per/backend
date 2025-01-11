import { Injectable, Logger } from "@nestjs/common";
import { OpenAIService, AIAnalysisResult } from "./openai.service";
import { OnEvent } from "@nestjs/event-emitter";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { QualityAssessmentService } from "./quality-assessment.service";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { CategorySpecificAssessment } from "../interfaces/category-assessments.interface";

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
      // Analyze image using OpenAI
      const analysis = await this.openaiService.analyzeProduceImage(event.image_url);
      
      // Create quality assessment from AI results
      const assessment = await this.qualityAssessmentService.createFromAI({
        produce_id: event.produce_id,
        quality_grade: analysis.quality_grade,
        confidence_level: analysis.confidence_level,
        defects: analysis.detected_defects,
        recommendations: analysis.recommendations,
        description: analysis.description,
        category: analysis.produce_category as ProduceCategory,
        category_specific_assessment: analysis.category_specific_attributes as CategorySpecificAssessment,
        location: event.location,
        metadata: {
          ai_model_version: "gpt-4-vision-preview",
          assessment_parameters: {
            name: analysis.name,
            product_variety: analysis.product_variety,
          },
          images: [event.image_url],
        },
      });
      
      this.logger.log(`Created AI assessment for produce ${event.produce_id}`);
      return assessment;
      
    } catch (error) {
      this.logger.error(`Failed to process AI assessment for produce ${event.produce_id}: ${error.message}`);
      // Emit assessment failed event
      await this.eventEmitter.emit('quality.assessment.failed', {
        produce_id: event.produce_id,
        error: error.message,
      });
    }
  }

  async analyzeImage(imageUrl: string): Promise<AIAnalysisResult> {
    return this.openaiService.analyzeProduceImage(imageUrl);
  }
}
