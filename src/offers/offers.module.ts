import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { Offer } from "./entities/offer.entity";
import { OffersService } from "./services/offers.service";
import { OffersController } from "./controllers/offers.controller";
import { DailyPrice } from "./entities/daily-price.entity";
import { DailyPriceService } from "./services/daily-price.service";
import { DailyPriceController } from "./controllers/daily-price.controller";
import { BuyersModule } from "../buyers/buyers.module";
import { ProduceModule } from "../produce/produce.module";
import { AutoOfferService } from "./services/auto-offer.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { QualityModule } from "../quality/quality.module";
import { ConfigModule } from "../config/config.module";
import { UsersModule } from "../users/users.module";
import { Buyer } from "../buyers/entities/buyer.entity";
import { QualityAssessment } from "../quality/entities/quality-assessment.entity";
import { Produce } from "../produce/entities/produce.entity";
import { AutoOfferGeneratorTask } from "./tasks/auto-offer-generator.task";
import { OfferNotificationListener } from "./listeners/offer-notification.listener";

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, DailyPrice, QualityAssessment, Produce, Buyer]),
    forwardRef(() => BuyersModule),
    ProduceModule,
    NotificationsModule,
    forwardRef(() => QualityModule),
    ConfigModule,
    UsersModule,
    CacheModule.register(),
  ],
  providers: [
    OffersService,
    DailyPriceService,
    AutoOfferService,
    AutoOfferGeneratorTask,
    OfferNotificationListener,
  ],
  controllers: [OffersController, DailyPriceController],
  exports: [OffersService, DailyPriceService, AutoOfferService],
})
export class OffersModule {}
