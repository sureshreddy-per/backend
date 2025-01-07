import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AutoOfferService } from './auto-offer.service';
import { ProduceService } from '../../produce/produce.service';
import { BuyersService } from '../../buyers/buyers.service';

@Injectable()
export class AutoOfferTriggerService {
  constructor(
    private readonly autoOfferService: AutoOfferService,
    private readonly produceService: ProduceService,
    private readonly buyersService: BuyersService
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
    const buyer = await this.buyersService.findOne(payload.buyerId);
    if (buyer) {
      await this.autoOfferService.generateOffersForBuyer(buyer);
    }
  }
} 