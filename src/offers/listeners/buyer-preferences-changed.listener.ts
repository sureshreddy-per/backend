import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AutoOfferService } from "../services/auto-offer.service";

@Injectable()
export class BuyerPreferencesChangedListener {
  private readonly logger = new Logger(BuyerPreferencesChangedListener.name);

  constructor(
    private readonly autoOfferService: AutoOfferService,
  ) {}

  @OnEvent("buyer.preferences.changed")
  async handleBuyerPreferencesChanged(payload: {
    buyer: any;
    oldPreferences: string[];
    newPreferences: string[];
    pricePreferences?: Array<{ produce_name: string; min_price: number; max_price: number; }>;
  }) {
    try {
      this.logger.log(`[BuyerPreferencesChangedListener] Handling preference changes for buyer ${payload.buyer.id}`);
      
      // Handle existing offers based on preference changes
      await this.autoOfferService.handleExistingOffers(
        payload.buyer.id,
        payload.oldPreferences,
        payload.newPreferences,
        payload.pricePreferences
      );
      
      this.logger.log(`[BuyerPreferencesChangedListener] Completed handling preference changes for buyer ${payload.buyer.id}`);
    } catch (error) {
      this.logger.error(
        `[BuyerPreferencesChangedListener] Error handling preference changes for buyer ${payload.buyer.id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
} 