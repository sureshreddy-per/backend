import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AutoOfferService } from "../services/auto-offer.service";
import { BuyersService } from "../../buyers/services/buyers.service";

@Injectable()
export class BuyerPreferencesUpdatedListener {
  private readonly logger = new Logger(BuyerPreferencesUpdatedListener.name);

  constructor(
    private readonly autoOfferService: AutoOfferService,
    private readonly buyersService: BuyersService,
  ) {}

  @OnEvent("buyer.preferences.updated")
  async handleBuyerPreferencesUpdated(payload: {
    buyer: any;
    oldPreferences: string[];
    newPreferences: string[];
    pricePreferences?: Array<{ produce_name: string; min_price: number; max_price: number; }>;
  }) {
    try {
      this.logger.log(`[BuyerPreferencesUpdatedListener] Buyer preferences updated for buyer ${payload.buyer.id}`);
      
      // Get full buyer details with preferences
      const buyer = await this.buyersService.findOne(payload.buyer.id);
      
      // Generate offers for the buyer's updated preferences
      await this.autoOfferService.generateOffersForBuyerPreferences(buyer);
      
      this.logger.log(`[BuyerPreferencesUpdatedListener] Completed offer generation for buyer ${payload.buyer.id}`);
    } catch (error) {
      this.logger.error(
        `[BuyerPreferencesUpdatedListener] Error handling buyer preferences update for buyer ${payload.buyer.id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
} 