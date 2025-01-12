import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RatingsService } from "./services/ratings.service";
import { RatingsController } from "./ratings.controller";
import { Rating } from "./entities/rating.entity";
import { User } from "../users/entities/user.entity";
import { Offer } from "../offers/entities/offer.entity";
import { AuthModule } from "../auth/auth.module";
import { OffersModule } from "../offers/offers.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, User, Offer]),
    AuthModule,
    OffersModule,
    forwardRef(() => TransactionsModule),
    NotificationsModule,
  ],
  providers: [RatingsService],
  controllers: [RatingsController],
  exports: [RatingsService],
})
export class RatingsModule {}
