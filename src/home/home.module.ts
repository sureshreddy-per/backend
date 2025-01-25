import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyPrice } from '../offers/entities/daily-price.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Produce } from '../produce/entities/produce.entity';
import { Buyer } from '../buyers/entities/buyer.entity';
import { BuyerPreferences } from '../buyers/entities/buyer-preferences.entity';
import { InspectionRequest } from '../quality/entities/inspection-request.entity';
import { QualityModule } from '../quality/quality.module';
import { FarmerHomeController } from './controllers/farmer-home.controller';
import { FarmerHomeService } from './services/farmer-home.service';
import { BuyerHomeController } from './controllers/buyer-home.controller';
import { BuyerHomeService } from './services/buyer-home.service';
import { Farmer } from '../farmers/entities/farmer.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { MarketTrendService } from '../market/services/market-trend.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DailyPrice,
      Offer,
      Produce,
      Buyer,
      BuyerPreferences,
      InspectionRequest,
      Farmer,
      Transaction
    ]),
    QualityModule,
    CacheModule.register()
  ],
  controllers: [FarmerHomeController, BuyerHomeController],
  providers: [FarmerHomeService, BuyerHomeService, MarketTrendService],
  exports: [FarmerHomeService, BuyerHomeService]
})
export class HomeModule {} 