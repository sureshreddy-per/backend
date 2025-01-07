import { Controller, Post, Body, Param } from '@nestjs/common';
import { AutoOfferService } from './auto-offer.service';
import { Produce } from '../produce/entities/produce.entity';
import { Buyer } from '../buyers/entities/buyer.entity';

@Controller('auto-offers')
export class AutoOfferController {
  constructor(private readonly autoOfferService: AutoOfferService) {}

  @Post('produce')
  generateOffersForProduce(@Body() produce: Produce): Promise<void> {
    return this.autoOfferService.generateOffersForProduce(produce);
  }

  @Post('buyer')
  generateOffersForBuyer(@Body() buyer: Buyer): Promise<void> {
    return this.autoOfferService.generateOffersForBuyer(buyer);
  }
} 