import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyPrice } from '../offers/entities/daily-price.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Produce } from '../produce/entities/produce.entity';
import { Buyer } from '../buyers/entities/buyer.entity';
import { InspectionRequest } from '../quality/entities/inspection-request.entity';
import { QualityModule } from '../quality/quality.module';
import { FarmerHomeController } from './controllers/farmer-home.controller';
import { FarmerHomeService } from './services/farmer-home.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DailyPrice,
      Offer,
      Produce,
      Buyer,
      InspectionRequest
    ]),
    QualityModule
  ],
  controllers: [FarmerHomeController],
  providers: [FarmerHomeService],
  exports: [FarmerHomeService]
})
export class HomeModule {} 