import { Injectable } from "@nestjs/common";
import { AutoOfferService } from "../../offers/services/auto-offer.service";
import { OffersService } from "../../offers/services/offers.service";

@Injectable()
export class BuyerPricesService {
  constructor(
    private readonly offersService: OffersService,
    private readonly autoOfferService: AutoOfferService,
  ) {}

  async handlePriceChange(
    produce_id: string,
    new_price: number,
  ): Promise<void> {
    // When price changes, we need to handle any pending offers
    const expiredOffers = await this.autoOfferService.findExpiredOffers();
    
    // Process expired offers
    await this.autoOfferService.handleExpiredOffers();
  }
}
