import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AutoOfferService } from "../../offers/services/auto-offer.service";
import { Buyer } from "../entities/buyer.entity";

@Injectable()
export class BuyerPriceUpdateListener {
  constructor(private readonly autoOfferService: AutoOfferService) {}

  @OnEvent("buyer.price.updated")
  async handleBuyerPriceUpdate(buyer: Buyer) {
    await this.autoOfferService.recalculateOffersForBuyer(buyer);
  }
}
