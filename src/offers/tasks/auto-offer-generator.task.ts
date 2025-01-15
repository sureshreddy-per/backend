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

  @OnEvent('quality.assessment.completed')
  async handleQualityAssessmentCompleted(event: QualityAssessmentCompletedEvent) {
    try {
      this.logger.log(`Generating auto offers for produce ${event.produce_id}`);
      
      // Get produce details
      const produce = await this.produceService.findOne(event.produce_id);
      
      // Update produce status to available
      await this.produceService.updateStatus(
        event.produce_id,
        ProduceStatus.AVAILABLE,
      );

      // Generate auto offers
      await this.autoOfferService.generateOffersForProduce(produce);

      this.logger.log(`Auto offers generated for produce ${event.produce_id}`);
    } catch (error) {
      this.logger.error(
        `Error generating auto offers for produce ${event.produce_id}: ${error.message}`,
        error.stack,
      );
    }
  }
} 