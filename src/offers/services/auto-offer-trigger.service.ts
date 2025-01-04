import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../entities/offer.entity';
import { BuyerPricesService } from '../../buyers/services/buyer-prices.service';
import { ProduceService } from '../../produce/produce.service';
import { AutoOfferManagerService } from './auto-offer-manager.service';

@Injectable()
export class AutoOfferTriggerService {
  private readonly logger = new Logger(AutoOfferTriggerService.name);

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly buyerPricesService: BuyerPricesService,
    private readonly produceService: ProduceService,
    private readonly autoOfferManager: AutoOfferManagerService,
  ) {}

  @OnEvent('quality.finalized')
  async handleQualityFinalized(payload: {
    produceId: string;
    qualityId: string;
    grade: number;
    finalPrice: number;
  }) {
    this.logger.log(`Quality finalized for produce ${payload.produceId} with grade ${payload.grade}`);

    // 1. Get the produce details
    const produce = await this.produceService.findOne(payload.produceId);
    if (!produce) {
      this.logger.warn(`Produce ${payload.produceId} not found`);
      return;
    }

    // 2. Find all active buyer prices for this grade
    const activeBuyers = await this.buyerPricesService.findAllActiveByGrade(
      produce.qualityGrade,
      new Date()
    );

    // 3. For each buyer with matching price
    for (const buyerPrice of activeBuyers) {
      if (buyerPrice.pricePerUnit >= payload.finalPrice) {
        // Create auto-offer if price is acceptable
        await this.autoOfferManager.createAutoOffer({
          buyerId: buyerPrice.buyerId,
          produceId: payload.produceId,
          pricePerUnit: buyerPrice.pricePerUnit,
          qualityGrade: produce.qualityGrade,
          qualityId: payload.qualityId
        });
      }
    }
  }

  @OnEvent('buyer.price.created')
  async handleBuyerPriceCreated(payload: { 
    buyerId: string;
    price: {
      qualityGrade: string;
      pricePerUnit: number;
    }
  }) {
    this.logger.log(`New buyer price created for buyer ${payload.buyerId}`);

    // 1. Find all produce with matching grade and no active offers
    const availableProduce = await this.produceService.findAvailableByGrade(
      payload.price.qualityGrade
    );

    // 2. Create auto-offers for each matching produce
    for (const produce of availableProduce) {
      // Only create offer if buyer's price meets or exceeds the produce's minimum price
      if (payload.price.pricePerUnit >= produce.minimumPrice) {
        await this.autoOfferManager.createAutoOffer({
          buyerId: payload.buyerId,
          produceId: produce.id,
          pricePerUnit: payload.price.pricePerUnit,
          qualityGrade: payload.price.qualityGrade,
          qualityId: produce.qualityId
        });
      }
    }
  }
} 