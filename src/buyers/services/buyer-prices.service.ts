import { Injectable } from '@nestjs/common';
import { AutoOfferManagerService } from '../../offers/services/auto-offer-manager.service';
import { OffersService } from '../../offers/services/offers.service';

@Injectable()
export class BuyerPricesService {
  constructor(
    private readonly offersService: OffersService,
    private readonly autoOfferManager: AutoOfferManagerService,
  ) {}

  async handlePriceChange(produceId: string, newPrice: number): Promise<void> {
    const expiredOffers = await this.autoOfferManager.findExpiredOffers();
    
    for (const offer of expiredOffers) {
      if (offer.produceId === produceId) {
        await this.autoOfferManager.expireOffer(
          offer,
          `Price changed from ${offer.pricePerUnit} to ${newPrice}`
        );
      }
    }
  }
} 