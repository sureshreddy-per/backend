import { Injectable } from '@nestjs/common';
import { BuyersService } from '../buyers/buyers.service';
import { ProduceService } from '../produce/produce.service';
import { OffersService } from './services/offers.service';
import { OfferStatus } from './entities/offer.entity';
import { Produce } from '../produce/entities/produce.entity';
import { Buyer } from '../buyers/entities/buyer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';

@Injectable()
export class AutoOfferService {
  constructor(
    private readonly offersService: OffersService,
    private readonly buyersService: BuyersService,
    private readonly produceService: ProduceService,
  ) {}

  async generateOffersForProduce(produce: Produce): Promise<void> {
    // Get all buyers since we don't have price range fields yet
    const buyers = await this.buyersService.findByPriceRange(produce.price_per_unit);
    
    // Generate offers for each matching buyer
    for (const buyer of buyers) {
      const createOfferDto: CreateOfferDto = {
        buyer_id: buyer.id,
        produce_id: produce.id,
        price: produce.price_per_unit,
        quantity: produce.quantity,
        message: 'Auto-generated offer based on your rules',
        valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        metadata: {
          auto_generated: true,
          initial_status: OfferStatus.PENDING
        }
      };
      await this.offersService.create(createOfferDto);
    }
  }

  async generateOffersForBuyer(buyer: Buyer): Promise<void> {
    // For now, we'll use a default max price since we don't have price range fields
    const DEFAULT_MAX_PRICE = 10000;
    const matchingProduce = await this.produceService.findByPriceRange(DEFAULT_MAX_PRICE);
    
    // Generate offers for each matching produce
    for (const produce of matchingProduce) {
      const createOfferDto: CreateOfferDto = {
        buyer_id: buyer.id,
        produce_id: produce.id,
        price: produce.price_per_unit,
        quantity: produce.quantity,
        message: 'Auto-generated offer based on your rules',
        valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        metadata: {
          auto_generated: true,
          initial_status: OfferStatus.PENDING
        }
      };
      await this.offersService.create(createOfferDto);
    }
  }
} 