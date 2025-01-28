import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { OffersService } from './services/offers.service';
import { OffersController } from './controllers/offers.controller';
import { Offer } from './entities/offer.entity';
import { AutoOfferService } from './services/auto-offer.service';
import { DailyPrice } from './entities/daily-price.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProduceModule } from '../produce/produce.module';
import { BuyersModule } from '../buyers/buyers.module';
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '../config/config.module';
import { DailyPriceCalculationService } from './services/daily-price-calculation.service';
import { QualityAssessment } from '../quality/entities/quality-assessment.entity';
import { Produce } from '../produce/entities/produce.entity';
import { Buyer } from '../buyers/entities/buyer.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { FarmersModule } from '../farmers/farmers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Offer,
      DailyPrice,
      QualityAssessment,
      Produce,
      Buyer,
      Transaction
    ]),
    CacheModule.register(),
    NotificationsModule,
    ProduceModule,
    forwardRef(() => BuyersModule),
    UsersModule,
    ConfigModule,
    FarmersModule,
  ],
  controllers: [OffersController],
  providers: [
    OffersService,
    AutoOfferService,
    DailyPriceCalculationService,
  ],
  exports: [OffersService, AutoOfferService],
})
export class OffersModule {}
