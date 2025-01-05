import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, LessThan } from 'typeorm';
import { Offer, OfferStatus } from '../entities/offer.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AutoOfferManagerService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findExpiredOffers(): Promise<Offer[]> {
    const offers = await this.offerRepository.find({
      where: {
        status: OfferStatus.PENDING,
        validUntil: LessThan(new Date()),
      },
      relations: ['produce', 'buyer'],
    });

    return offers;
  }

  async expireOffer(offer: Offer, reason: string): Promise<Offer> {
    const updatedData: DeepPartial<Offer> = {
      id: offer.id,
      status: OfferStatus.EXPIRED,
      metadata: {
        ...offer.metadata,
        expiryReason: reason,
        expiryMetadata: {
          expiredAt: new Date(),
          originalValidUntil: offer.validUntil,
        },
      },
    };

    const updatedOffer = await this.offerRepository.save(updatedData);
    const refreshedOffer = await this.offerRepository.findOne({
      where: { id: updatedOffer.id },
      relations: ['produce', 'buyer'],
    });

    if (!refreshedOffer) {
      throw new Error('Failed to refresh offer after expiry');
    }

    this.eventEmitter.emit('offer.expired', {
      offerId: refreshedOffer.id,
      buyerId: refreshedOffer.buyerId,
      produceId: refreshedOffer.produceId,
      reason,
    });

    return refreshedOffer;
  }
} 