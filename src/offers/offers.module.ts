import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { Offer } from './entities/offer.entity';
import { AutoOfferRules } from './entities/auto-offer-rules.entity';
import { AutoOfferManagerService } from './services/auto-offer-manager.service';
import { AutoOfferTriggerService } from './services/auto-offer-trigger.service';
import { BuyerPricesModule } from '../buyers/buyer-prices.module';
import { ProduceModule } from '../produce/produce.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, AutoOfferRules]),
    BuyerPricesModule,
    ProduceModule,
    NotificationsModule,
  ],
  controllers: [OffersController],
  providers: [
    OffersService,
    AutoOfferManagerService,
    AutoOfferTriggerService,
  ],
  exports: [OffersService, AutoOfferManagerService],
})
export class OffersModule {} 