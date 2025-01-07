import { Injectable } from '@nestjs/common';
import { AutoOfferManagerService } from '../../offers/services/auto-offer-manager.service';
import { OffersService } from '../../offers/services/offers.service';

@Injectable()
export class BuyerPricesService {
  constructor(
    private readonly offersService: OffersService,
    private readonly autoOfferManager: AutoOfferManagerService,
  ) {}

  async handlePriceChange(produce_id: string, new_price: number): Promise<void> {
    const expiredOffers = await this.autoOfferManager.findExpiredOffers();
    
    for (const offer of expiredOffers) {
      if (offer.produce_id === produce_id) {
        await this.autoOfferManager.expireOffer(offer);
      }
    }
  }
} 