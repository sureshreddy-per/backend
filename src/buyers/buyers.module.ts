import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BuyersService } from "./buyers.service";
import { BuyersController } from "./buyers.controller";
import { Buyer } from "./entities/buyer.entity";
import { BuyerPreferences } from "./entities/buyer-preferences.entity";
import { BuyerPreferencesService } from "./services/buyer-preferences.service";
import { BuyerPreferencesController } from "./controllers/buyer-preferences.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Buyer, BuyerPreferences]),
    UsersModule,
  ],
  providers: [BuyersService, BuyerPreferencesService],
  controllers: [BuyersController, BuyerPreferencesController],
  exports: [BuyersService, BuyerPreferencesService],
})
export class BuyersModule {}
