import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AutoOfferService } from '../services/auto-offer.service';
import { ProduceService } from '../../produce/services/produce.service';
import { QualityAssessmentCompletedEvent } from '../../quality/events/quality-assessment-completed.event';
import { ProduceStatus } from '../../produce/enums/produce-status.enum';

@Injectable()
export class AutoOfferGeneratorTask {
  private readonly logger = new Logger(AutoOfferGeneratorTask.name);

  constructor(
    private readonly autoOfferService: AutoOfferService,
    private readonly produceService: ProduceService,
  ) {}

  @OnEvent('quality.assessment.saved')
  async handleQualityAssessmentCompleted(event: QualityAssessmentCompletedEvent) {
    try {
      this.logger.log(`[AutoOfferGeneratorTask] Quality assessment completed event received for produce ${event.produce_id}`);
      this.logger.debug(`[AutoOfferGeneratorTask] Event details: quality_grade=${event.quality_grade}, confidence=${event.confidence_level}`);
      
      // Get produce details
      const produce = await this.produceService.findOne(event.produce_id);
      this.logger.debug(`[AutoOfferGeneratorTask] Found produce: name=${produce.name}, status=${produce.status}, location=${produce.location}`);
      
      // Update produce status to available
      await this.produceService.updateStatus(
        event.produce_id,
        ProduceStatus.AVAILABLE,
      );
      this.logger.debug(`[AutoOfferGeneratorTask] Updated produce status to AVAILABLE`);

      // Generate auto offers
      this.logger.debug(`[AutoOfferGeneratorTask] Starting auto offer generation`);
      await this.autoOfferService.generateOffersForProduce(produce);

      this.logger.log(`[AutoOfferGeneratorTask] Auto offers generation completed for produce ${event.produce_id}`);
    } catch (error) {
      this.logger.error(
        `[AutoOfferGeneratorTask] Error generating auto offers for produce ${event.produce_id}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to ensure error is properly handled
    }
  }
} 