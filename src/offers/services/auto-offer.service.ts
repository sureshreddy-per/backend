import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../entities/offer.entity';
import { Produce } from '../../produce/entities/produce.entity';
import { ProduceService } from '../../produce/produce.service';
import { BuyersService } from '../../buyers/buyers.service';
import { OfferStatus } from '../enums/offer-status.enum';
import { Buyer } from '../../buyers/entities/buyer.entity';

@Injectable()
export class AutoOfferService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly produceService: ProduceService,
    private readonly buyersService: BuyersService
  ) {}

  async generateOffersForProduce(produce: Produce) {
    const nearbyBuyers = await this.buyersService.findNearbyBuyers(
      produce.latitude,
      produce.longitude,
      100
    );

    const offers: Offer[] = [];

    for (const buyer of nearbyBuyers) {
      const offer = new Offer();
      Object.assign(offer, {
        buyer_id: buyer.id,
        produce_id: produce.id,
        price_per_unit: produce.price_per_unit,
        quantity: produce.quantity,
        status: OfferStatus.PENDING,
        metadata: {
          quality_grade: produce.quality_grade,
          auto_generated_at: new Date(),
          price_history: [],
          last_price_update: {
            old_price: 0,
            new_price: produce.price_per_unit,
            timestamp: new Date()
          }
        },
        created_at: new Date(),
        updated_at: new Date()
      });

      offers.push(await this.offerRepository.save(offer));
    }

    return offers;
  }

  async generateOffersForBuyer(buyer: Buyer) {
    const matchingProduce = await this.produceService.findNearby(
      buyer.latitude,
      buyer.longitude,
      100
    );

    const offers: Offer[] = [];

    for (const produce of matchingProduce) {
      const offer = new Offer();
      Object.assign(offer, {
        buyer_id: buyer.id,
        produce_id: produce.id,
        price_per_unit: produce.price_per_unit,
        quantity: produce.quantity,
        status: OfferStatus.PENDING,
        metadata: {
          quality_grade: produce.quality_grade,
          auto_generated_at: new Date(),
          price_history: [],
          last_price_update: {
            old_price: 0,
            new_price: produce.price_per_unit,
            timestamp: new Date()
          }
        },
        created_at: new Date(),
        updated_at: new Date()
      });

      offers.push(await this.offerRepository.save(offer));
    }

    return offers;
  }
} 