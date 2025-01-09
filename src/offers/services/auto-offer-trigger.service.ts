import { Injectable } from '@nestjs/common';
import { AutoOfferService } from './auto-offer.service';
import { Produce } from '../../produce/entities/produce.entity';
import { Buyer } from '../../buyers/entities/buyer.entity';

@Injectable()
export class AutoOfferTriggerService {
  constructor(
    private readonly autoOfferService: AutoOfferService,
  ) {}

  async handleNewProduce(produce: Produce): Promise<void> {
    await this.autoOfferService.generateOffersForProduce(produce);
  }

  async handleNewBuyer(buyer: Buyer): Promise<void> {
    await this.autoOfferService.generateOffersForBuyer(buyer);
  }
}