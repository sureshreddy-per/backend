import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { BuyerPrice } from "../entities/buyer-price.entity";
import { AutoOfferService } from "../../offers/services/auto-offer.service";
import { OffersService } from "../../offers/services/offers.service";

@Injectable()
export class BuyerPricesService {
  constructor(
    @InjectRepository(BuyerPrice)
    private readonly buyerPriceRepository: Repository<BuyerPrice>,
    @Inject(forwardRef(() => OffersService))
    private readonly offersService: OffersService,
    @Inject(forwardRef(() => AutoOfferService))
    private readonly autoOfferService: AutoOfferService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handlePriceChange(
    produce_id: string,
    new_price: number,
  ): Promise<void> {
    try {
      // Update the price in the offers service
      await this.offersService.handlePriceChange(produce_id, new_price);

      // Emit event for price change
      this.eventEmitter.emit('buyer.price.changed', {
        produce_id,
        new_price,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error in handlePriceChange:', error);
      throw error;
    }
  }
}
