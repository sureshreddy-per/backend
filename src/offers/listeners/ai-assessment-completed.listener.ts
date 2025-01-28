import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AutoOfferService } from "../services/auto-offer.service";
import { ProduceService } from "../../produce/services/produce.service";
import { ProduceStatus } from "../../produce/enums/produce-status.enum";

@Injectable()
export class AIAssessmentCompletedListener {
  private readonly logger = new Logger(AIAssessmentCompletedListener.name);

  constructor(
    private readonly autoOfferService: AutoOfferService,
    private readonly produceService: ProduceService,
  ) {}

  @OnEvent("ai.assessment.completed")
  async handleAIAssessmentCompleted(payload: { 
    produce_id: string;
    quality_grade: number;
    confidence_level: number;
  }) {
    try {
      this.logger.log(`[AIAssessmentCompletedListener] AI assessment completed for produce ${payload.produce_id}`);
      
      // Get produce details
      const produce = await this.produceService.findOne(payload.produce_id);
      
      // Update produce status to ASSESSED
      await this.produceService.updateStatus(
        payload.produce_id,
        ProduceStatus.AVAILABLE
      );
      
      this.logger.debug(`[AIAssessmentCompletedListener] Updated produce status to ASSESSED. Starting auto offer generation.`);
      
      // Generate auto offers
      await this.autoOfferService.generateOffersForProduce(produce);
      
      this.logger.log(`[AIAssessmentCompletedListener] Auto offers generation completed for produce ${payload.produce_id}`);
    } catch (error) {
      this.logger.error(
        `[AIAssessmentCompletedListener] Error handling AI assessment completion for produce ${payload.produce_id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
} 