import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BuyersService } from "./buyers.service";
import { BuyersController } from "./controllers/buyers.controller";
import { Buyer } from "./entities/buyer.entity";
import { BuyerPreferences } from "./entities/buyer-preferences.entity";
import { BuyerPreferencesController } from "./controllers/buyer-preferences.controller";
import { BuyerPreferencesService } from "./services/buyer-preferences.service";
import { OffersModule } from "../offers/offers.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Buyer, BuyerPreferences]),
    forwardRef(() => OffersModule),
    NotificationsModule,
  ],
  providers: [
    BuyersService,
    BuyerPreferencesService,
  ],
  controllers: [BuyersController, BuyerPreferencesController],
  exports: [BuyersService, BuyerPreferencesService],
})
export class BuyersModule {}
