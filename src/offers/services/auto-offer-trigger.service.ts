import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AutoOfferService } from './auto-offer.service';
import { ProduceService } from '../../produce/produce.service';

@Injectable()
export class AutoOfferTriggerService {
  constructor(
    private readonly autoOfferService: AutoOfferService,
    private readonly produceService: ProduceService
  ) {}

  @OnEvent('quality.grade.finalized')
  async onQualityGradeFinalized(payload: { produceId: string; grade: string }) {
    const produce = await this.produceService.findOne(payload.produceId);
    if (produce) {
      await this.autoOfferService.generateOffersForProduce(produce);
    }
  }

  @OnEvent('buyer.price.created')
  async onBuyerPriceCreated(payload: { buyerId: string; price: any }) {
    await this.autoOfferService.generateOffersForBuyer(payload);
  }
} 