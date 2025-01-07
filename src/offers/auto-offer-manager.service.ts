import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AutoOfferRules } from './entities/auto-offer-rules.entity';
import { Produce } from '../produce/entities/produce.entity';
import { OffersService } from './services/offers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OfferStatus } from './entities/offer.entity';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import { Offer } from './entities/offer.entity';

@Injectable()
export class AutoOfferManagerService {
  constructor(
    @InjectRepository(AutoOfferRules)
    private readonly autoOfferRuleRepository: Repository<AutoOfferRules>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly offersService: OffersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async processNewProduce(produce: Produce): Promise<void> {
    const matchingRules = await this.findMatchingRules(produce);

    for (const rule of matchingRules) {
      await this.createAutoOffer(rule, produce);
    }
  }

  private async findMatchingRules(produce: Produce): Promise<AutoOfferRules[]> {
    return this.autoOfferRuleRepository.find({
      where: {
        produce_category: produce.produce_category,
        is_active: true,
      },
      relations: ['buyer'],
    });
  }

  private async createAutoOffer(rule: AutoOfferRules, produce: Produce): Promise<void> {
    const validUntil = this.calculateValidUntil();
    const offerData: CreateOfferDto = {
      produce_id: produce.id,
      buyer_id: rule.buyer_id,
      price: this.calculateOfferPrice(rule, produce),
      quantity: produce.quantity,
      message: 'Auto-generated offer based on your preferences',
      metadata: {
        auto_generated: true,
        initial_status: OfferStatus.PENDING,
        valid_until: validUntil
      }
    };

    const offer = await this.offersService.create(offerData);

    const farmerNotification: CreateNotificationDto = {
      user_id: produce.farmer_id,
      type: NotificationType.NEW_OFFER,
      title: 'New Auto Offer',
      message: `You have received a new auto-generated offer for your ${produce.name}`,
    };

    const buyerNotification: CreateNotificationDto = {
      user_id: rule.buyer_id,
      type: NotificationType.AUTO_OFFER_CREATED,
      title: 'Auto Offer Created',
      message: `An auto offer has been created for ${produce.name} based on your preferences`,
    };

    await this.notificationsService.create(farmerNotification);
    await this.notificationsService.create(buyerNotification);
  }

  async findExpiredOffers(): Promise<Offer[]> {
    const now = new Date();
    const offers = await this.offerRepository.find({
      where: { status: OfferStatus.PENDING },
      relations: ['produce', 'buyer']
    });

    return offers.filter(offer => {
      const validUntil = offer.metadata?.valid_until;
      return validUntil && new Date(validUntil) < now;
    });
  }

  async expireOffer(offer: Offer): Promise<void> {
    offer.status = OfferStatus.EXPIRED;
    offer.metadata = {
      ...offer.metadata,
      expired_at: new Date()
    };
    await this.offerRepository.save(offer);

    await this.notificationsService.create({
      user_id: offer.buyer_id,
      type: NotificationType.OFFER_EXPIRED,
      title: 'Offer Expired',
      message: `Your offer for ${offer.produce.name} has expired`,
    });
  }

  private calculateOfferPrice(rule: AutoOfferRules, produce: Produce): number {
    const basePrice = produce.price_per_unit;
    const maxPrice = rule.max_price || basePrice;
    const minPrice = rule.min_price || basePrice * 0.8;

    return Math.min(maxPrice, Math.max(minPrice, basePrice));
  }

  private calculateValidUntil(): Date {
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 24);
    return validUntil;
  }
} 