import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { DailyPrice } from './entities/daily-price.entity';
import { OffersService } from './services/offers.service';
import { DailyPriceService } from './services/daily-price.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProduceModule } from '../produce/produce.module';
import { OffersController } from './controllers/offers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, DailyPrice]),
    NotificationsModule,
    ProduceModule,
  ],
  controllers: [OffersController],
  providers: [OffersService, DailyPriceService],
  exports: [OffersService, DailyPriceService],
})
export class OffersModule {} 