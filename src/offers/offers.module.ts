import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersController } from './controllers/offers.controller';
import { OffersService } from './services/offers.service';
import { Offer } from './entities/offer.entity';
import { OffersGateway } from './offers.gateway';
import { AutoOfferManagerService } from './services/auto-offer-manager.service';

@Module({
  imports: [TypeOrmModule.forFeature([Offer])],
  controllers: [OffersController],
  providers: [OffersService, OffersGateway, AutoOfferManagerService],
  exports: [OffersService]
})
export class OffersModule {} 