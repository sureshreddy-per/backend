import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OfferTransformationService } from './services/offer-transformation.service';
import { AutoOfferGeneratorTask } from './tasks/auto-offer-generator.task';
import { ProduceMaster } from '../produce/entities/produce-master.entity';
import { AIAssessmentCompletedListener } from './listeners/ai-assessment-completed.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Offer,
      DailyPrice,
      QualityAssessment,
      Produce,
      Buyer,
      Transaction,
      ProduceMaster
    ]),
    EventEmitterModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => ProduceModule),
    forwardRef(() => BuyersModule),
    forwardRef(() => UsersModule),
    forwardRef(() => ConfigModule),
    forwardRef(() => FarmersModule),
  ],
  controllers: [OffersController],
  providers: [
    OffersService,
    AutoOfferService,
    DailyPriceCalculationService,
    OfferTransformationService,
    AutoOfferGeneratorTask,
    {
      provide: EventEmitter2,
      useFactory: () => new EventEmitter2(),
    },
    AIAssessmentCompletedListener,
  ],
  exports: [OffersService, AutoOfferService],
})
export class OffersModule {}
