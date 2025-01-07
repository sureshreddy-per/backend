import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Offer, OfferStatus } from '../entities/offer.entity';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';

@Injectable()
export class AutoOfferManagerService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('*/5 * * * *') // Run every 5 minutes
  async handleExpiredOffers() {
    const expiredOffers = await this.findExpiredOffers();
    for (const offer of expiredOffers) {
      await this.expireOffer(offer);
    }
  }

  async findExpiredOffers(): Promise<Offer[]> {
    return this.offerRepository.find({
      where: {
        status: OfferStatus.PENDING,
        valid_until: LessThan(new Date()),
      },
      relations: ['buyer', 'produce'],
    });
  }

  async expireOffer(offer: Offer): Promise<Offer> {
    // Store original values for notification
    const metadata = {
      original_valid_until: offer.valid_until,
    };

    // Update offer status to EXPIRED
    const updatedOffer = await this.offerRepository.save({
      ...offer,
      status: OfferStatus.EXPIRED,
      metadata: {
        ...offer.metadata,
        ...metadata,
      },
    });

    // Send notifications
    await this.notifyOfferExpired(updatedOffer);

    return updatedOffer;
  }

  private async notifyOfferExpired(offer: Offer) {
    // Notify buyer
    await this.notificationsService.create(
      offer.buyer_id,
      NotificationType.OFFER_REJECTED,
      'Offer Expired',
      `Your offer for ${offer.produce.name} has expired`,
      {
        offer_id: offer.id,
        produce_id: offer.produce_id,
      },
    );
  }
} 