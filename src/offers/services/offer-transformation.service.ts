import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Offer } from '../entities/offer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProduceService } from '../../produce/services/produce.service';

interface TransformedBuyer {
  id: string;
  business_name: string;
  address: string;
  location: string;
  name: string;
  avatar_url: string;
  rating: number;
  total_completed_transactions: number;
}

@Injectable()
export class OfferTransformationService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly produceService: ProduceService,
  ) {}

  private transformBuyerData(offer: Offer): TransformedBuyer {
    if (!offer.buyer || !offer.buyer.user) {
      return null;
    }

    return {
      id: offer.buyer.id,
      business_name: offer.buyer.business_name,
      address: offer.buyer.address || '',
      location: offer.buyer.location || '',
      name: offer.buyer.user.name,
      avatar_url: offer.buyer.user.avatar_url,
      rating: offer.buyer.user.rating || 0,
      total_completed_transactions: offer.buyer.user.total_completed_transactions || 0
    };
  }

  public async transformOffer(offer: Offer, transactionalEntityManager?: EntityManager): Promise<Offer> {
    // Load full offer with relations if not already loaded
    if (!offer.buyer?.user || !offer.produce) {
      const repository = transactionalEntityManager?.getRepository(Offer) || this.offerRepository;
      offer = await repository.findOne({
        where: { id: offer.id },
        relations: [
          "produce",
          "produce.farmer",
          "produce.farmer.user",
          "produce.quality_assessments",
          "buyer",
          "buyer.user"
        ],
      });
    }

    // Transform produce data
    if (offer.produce) {
      offer.produce = this.produceService.transformProduceForResponse(offer.produce);
    }

    // Transform buyer data to match required structure
    (offer.buyer as any) = this.transformBuyerData(offer);

    return offer;
  }
}