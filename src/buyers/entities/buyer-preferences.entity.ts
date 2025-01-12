import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Repository, ManyToOne, JoinColumn } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OffersService } from "../../offers/services/offers.service";
import { NotificationService } from "../../notifications/services/notification.service";
import { NotificationType } from "../../notifications/enums/notification-type.enum";
import { OfferStatus } from "../../offers/enums/offer-status.enum";
import { Buyer } from "./buyer.entity";

export interface UpdateBuyerPreferencesDto {
  produce_names?: string[];
  notification_enabled?: boolean;
  notification_methods?: string[];
}

@Injectable()
@Entity("buyer_preferences")
export class BuyerPreferences {
  constructor(
    @InjectRepository(BuyerPreferences)
    private readonly buyerPreferencesRepository: Repository<BuyerPreferences>,
    private readonly offersService: OffersService,
    private readonly notificationService: NotificationService,
  ) {}

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  buyer_id: string;

  @ManyToOne(() => Buyer)
  @JoinColumn({ name: "buyer_id" })
  buyer: Buyer;

  @Column({ type: "text", array: true, nullable: true })
  produce_names: string[];

  @Column({ type: "boolean", default: true })
  notification_enabled: boolean;

  @Column({ type: "text", array: true, nullable: true })
  notification_methods: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  private async handlePendingOffers(buyerId: string, oldPreferences: string[], newPreferences: string[]): Promise<void> {
    const pendingOffers = await this.offersService.findByBuyer(buyerId);

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

  async setPreferences(buyerId: string, data: UpdateBuyerPreferencesDto): Promise<BuyerPreferences> {
    let preferences = await this.buyerPreferencesRepository.findOne({ where: { buyer_id: buyerId } });
    const oldPreferences = preferences?.produce_names || [];

    if (!preferences) {
      preferences = this.buyerPreferencesRepository.create({
        buyer_id: buyerId,
        produce_names: [],
      });
    }

    if (data.produce_names) {
      preferences.produce_names = data.produce_names;
      await this.handlePendingOffers(buyerId, oldPreferences, data.produce_names);
    }

    if (data.notification_enabled !== undefined) {
      preferences.notification_enabled = data.notification_enabled;
    }

    if (data.notification_methods) {
      preferences.notification_methods = data.notification_methods;
    }

    return this.buyerPreferencesRepository.save(preferences);
  }
} 