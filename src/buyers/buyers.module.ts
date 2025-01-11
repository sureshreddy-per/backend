import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BuyersService } from "./buyers.service";
import { BuyersController } from "./buyers.controller";
import { Buyer } from "./entities/buyer.entity";
import { BuyerPreferences } from "./entities/buyer-preferences.entity";
import { BuyerPreferencesService } from "./services/buyer-preferences.service";
import { BuyerPreferencesController } from "./controllers/buyer-preferences.controller";
import { BuyerPricesController } from "./controllers/buyer-prices.controller";
import { BuyerPricesService } from "./services/buyer-prices.service";
import { BuyerPrice } from "./entities/buyer-price.entity";
import { UsersModule } from "../users/users.module";
import { OffersModule } from "../offers/offers.module";
import { BuyerPriceUpdateListener } from "./listeners/buyer-price-update.listener";

@Module({
  imports: [
    TypeOrmModule.forFeature([Buyer, BuyerPreferences, BuyerPrice]),
    UsersModule,
    forwardRef(() => OffersModule),
  ],
  providers: [
    BuyersService,
    BuyerPreferencesService,
    BuyerPricesService,
    BuyerPriceUpdateListener,
  ],
  controllers: [BuyersController, BuyerPreferencesController, BuyerPricesController],
  exports: [BuyersService, BuyerPreferencesService, BuyerPricesService],
})
export class BuyersModule {}
