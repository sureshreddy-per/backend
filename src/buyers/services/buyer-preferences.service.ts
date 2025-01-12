import { Injectable, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager, Not, IsNull, In } from "typeorm";
import { BuyerPreferences } from "../entities/buyer-preferences.entity";
import { BuyersService } from "../buyers.service";
import { ProduceSynonymService } from "../../produce/services/synonym.service";
import { Offer } from "../../offers/entities/offer.entity";
import { OfferStatus } from "../../offers/enums/offer-status.enum";
import { NotificationService } from "../../notifications/services/notification.service";
import { NotificationType } from "../../notifications/enums/notification-type.enum";
import { AutoOfferService } from "../../offers/services/auto-offer.service";
import { ProduceService } from "../../produce/services/produce.service";

@Injectable()
export class BuyerPreferencesService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly buyersService: BuyersService,
    private readonly synonymService: ProduceSynonymService,
    private readonly notificationService: NotificationService,
    private readonly autoOfferService: AutoOfferService,
    private readonly produceService: ProduceService,
  ) {}

  private async validateAndGetCanonicalName(produceName: string): Promise<string> {
    const canonicalName = await this.synonymService.findProduceName(produceName);
    if (!canonicalName) {
      throw new NotFoundException(`Invalid produce name: ${produceName}`);
    }
    return canonicalName;
  }

  private async handlePendingOffers(buyerId: string, newProduceNames: string[]): Promise<void> {
    // Get all pending and active offers for this buyer
    const existingOffers = await this.entityManager.find(Offer, {
      where: {
        buyer_id: buyerId,
        status: In([OfferStatus.PENDING, OfferStatus.ACTIVE])
      },
      relations: ['produce']
    });

    // Cancel offers for removed produce
    for (const offer of existingOffers) {
      if (!newProduceNames.includes(offer.produce.name)) {
        offer.status = OfferStatus.CANCELLED;
        offer.metadata = {
          ...offer.metadata,
          cancellation_reason: 'Cancelled due to buyer preference update',
          cancelled_at: new Date()
        };

        await this.entityManager.save(Offer, offer);

        await this.notificationService.create({
          user_id: offer.farmer_id,
          type: NotificationType.OFFER_STATUS_UPDATE,
          data: {
            offer_id: offer.id,
            produce_id: offer.produce_id,
            status: OfferStatus.CANCELLED,
            reason: 'Buyer updated their produce preferences',
            old_status: offer.status,
            new_status: OfferStatus.CANCELLED,
            timestamp: new Date()
          }
        });
      }
    }

    // Generate new offers for added produce names
    const availableProduce = await this.produceService.findAll({
      where: {
        name: In(newProduceNames),
        status: 'AVAILABLE'
      }
    });

    // Generate offers for each newly added produce
    for (const produce of availableProduce) {
      const existingOffer = existingOffers.find(o => o.produce_id === produce.id);
      if (!existingOffer) {
        await this.autoOfferService.generateOffersForProduce(produce);
      }
    }
  }

  async setPreferences(
    userId: string,
    data: {
      produce_names?: string[];
      notification_enabled?: boolean;
      notification_methods?: string[];
    },
  ): Promise<BuyerPreferences> {
    const buyer = await this.buyersService.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    let preferences = await this.entityManager.findOne(BuyerPreferences, {
      where: { buyer_id: buyer.id }
    });

    if (!preferences) {
      preferences = this.entityManager.create(BuyerPreferences, {
        buyer_id: buyer.id,
        notification_enabled: true,
      });
    }

    if (data.produce_names) {
      // Validate and convert all produce names to canonical names
      const canonicalNames = await Promise.all(
        data.produce_names.map(name => this.validateAndGetCanonicalName(name))
      );
      preferences.produce_names = canonicalNames;

      // Handle pending offers and generate new ones based on new preferences
      await this.handlePendingOffers(buyer.id, canonicalNames);
    }
    
    if (data.notification_enabled !== undefined) {
      preferences.notification_enabled = data.notification_enabled;
    }
    if (data.notification_methods) {
      preferences.notification_methods = data.notification_methods;
    }

    return this.entityManager.save(BuyerPreferences, preferences);
  }

  async getPreferences(userId: string): Promise<BuyerPreferences> {
    try {
      const buyer = await this.buyersService.findByUserId(userId);
      if (!buyer) {
        throw new NotFoundException(`Buyer not found for user ${userId}`);
      }

      const preferences = await this.entityManager.findOne(BuyerPreferences, {
        where: { buyer_id: buyer.id }
      });

      if (!preferences) {
        // Return default preferences if none exist
        return this.entityManager.create(BuyerPreferences, {
          buyer_id: buyer.id,
          produce_names: [],
          notification_enabled: true,
          notification_methods: []
        });
      }

      return preferences;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get buyer preferences');
    }
  }
} 