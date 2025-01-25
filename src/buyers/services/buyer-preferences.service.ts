import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuyerPreferences } from '../entities/buyer-preferences.entity';
import { OffersService } from '../../offers/services/offers.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { OfferStatus } from '../../offers/enums/offer-status.enum';
import { OfferSortBy, SortOrder } from '../../offers/dto/list-offers.dto';
import { ProduceService } from '../../produce/services/produce.service';
import { AutoOfferService } from '../../offers/services/auto-offer.service';
import { Buyer } from '../entities/buyer.entity';
import { ProduceStatus } from '../../produce/enums/produce-status.enum';

export interface UpdateBuyerPreferencesDto {
  produce_names?: string[];
  produce_price_preferences?: Array<{
    produce_name: string;
    min_price: number;
    max_price: number;
  }>;
  notification_enabled?: boolean;
  notification_methods?: string[];
}

@Injectable()
export class BuyerPreferencesService {
  constructor(
    @InjectRepository(BuyerPreferences)
    private readonly buyerPreferencesRepository: Repository<BuyerPreferences>,
    private readonly offersService: OffersService,
    private readonly notificationService: NotificationService,
    private readonly produceService: ProduceService,
    private readonly autoOfferService: AutoOfferService,
  ) {}

  private async handlePendingOffers(buyerId: string, oldPreferences: string[], newPreferences: string[]): Promise<void> {
    // Get pending offers for this buyer
    const pendingOffers = await this.offersService.findByBuyer(buyerId, {
      status: OfferStatus.PENDING,
      sort: [{
        field: OfferSortBy.CREATED_AT,
        order: SortOrder.DESC
      }],
      page: 1,
      limit: 100
    });

    for (const offer of pendingOffers.items) {
      if (!newPreferences.includes(offer.produce.name)) {
        await this.offersService.cancel(offer.id, 'Produce removed from buyer preferences');

        await this.notificationService.create({
          user_id: offer.farmer_id,
          type: NotificationType.OFFER_STATUS_UPDATE,
          data: {
            offer_id: offer.id,
            produce_id: offer.produce_id,
            status: OfferStatus.CANCELLED,
            reason: 'Produce removed from buyer preferences',
            old_status: OfferStatus.PENDING,
            new_status: OfferStatus.CANCELLED,
            timestamp: new Date()
          }
        });
      }
    }
  }

  private async generateOffersForNearbyProduce(buyer: Buyer, produceNames: string[]) {
    if (!buyer.location) {
      return;
    }

    // Parse buyer location
    const [buyerLat, buyerLng] = buyer.location.split(',').map(Number);

    // Find nearby available produce within 100km radius
    const nearbyProduce = await this.produceService.findNearby(
      buyerLat,
      buyerLng,
      100 // 100km radius
    );

    // Filter by status and produce names
    const filteredProduce = nearbyProduce.filter(produce => 
      produce.status === ProduceStatus.ASSESSED && 
      produceNames.includes(produce.name)
    );

    // Generate offers for each filtered produce
    for (const produce of filteredProduce) {
      try {
        await this.autoOfferService.generateOffersForProduce(produce);
      } catch (error) {
        // Log error but continue with next produce
        console.error(`Failed to generate offer for produce ${produce.id}:`, error);
      }
    }
  }

  async findByBuyerId(buyerId: string): Promise<BuyerPreferences> {
    const preferences = await this.buyerPreferencesRepository.findOne({
      where: { buyer_id: buyerId }
    });

    if (!preferences) {
      throw new NotFoundException(`Preferences not found for buyer ${buyerId}`);
    }

    return preferences;
  }

  async setPreferences(buyerId: string, data: UpdateBuyerPreferencesDto): Promise<BuyerPreferences> {
    let preferences = await this.buyerPreferencesRepository.findOne({ 
      where: { buyer_id: buyerId },
      relations: ['buyer']
    });
    const oldPreferences = preferences?.produce_names || [];

    if (!preferences) {
      throw new NotFoundException(`Preferences not found for buyer ${buyerId}`);
    }

    let shouldGenerateOffers = false;
    let updatedProduceNames = preferences.produce_names;

    if (data.produce_names) {
      preferences.produce_names = data.produce_names;
      updatedProduceNames = data.produce_names;
      await this.handlePendingOffers(buyerId, oldPreferences, data.produce_names);
      shouldGenerateOffers = true;
    }

    if (data.produce_price_preferences) {
      preferences.produce_price_preferences = data.produce_price_preferences;
      preferences.last_price_updated = new Date();
      updatedProduceNames = Array.from(new Set([
        ...updatedProduceNames,
        ...data.produce_price_preferences.map(pref => pref.produce_name)
      ]));
      shouldGenerateOffers = true;
    }

    if (data.notification_enabled !== undefined) {
      preferences.notification_enabled = data.notification_enabled;
    }

    if (data.notification_methods) {
      preferences.notification_methods = data.notification_methods;
    }

    // Save preferences first
    preferences = await this.buyerPreferencesRepository.save(preferences);

    // Generate offers if needed
    if (shouldGenerateOffers && preferences.buyer) {
      await this.generateOffersForNearbyProduce(
        preferences.buyer,
        updatedProduceNames
      );
    }

    return preferences;
  }
} 