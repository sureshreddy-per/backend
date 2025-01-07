import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Offer, OfferStatus } from '../entities/offer.entity';
import { NotificationType } from '../../notifications/enums/notification-type.enum';

@Injectable()
export class AutoOfferManagerService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
  ) {}

  async findExpiredOffers(): Promise<Offer[]> {
    const now = new Date();
    const offers = await this.offerRepository.find({
      where: {
        status: OfferStatus.PENDING
      }
    });

    return offers.filter(offer => {
      const validUntil = offer.metadata?.valid_until;
      return validUntil && new Date(validUntil) < now;
    });
  }

  async expireOffer(offer: Offer): Promise<Offer> {
    offer.status = OfferStatus.EXPIRED;
    offer.metadata = {
      ...offer.metadata,
      expired_at: new Date()
    };
    return this.offerRepository.save(offer);
  }
} 