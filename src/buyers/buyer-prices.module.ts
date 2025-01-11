import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BuyerPricesController } from "./controllers/buyer-prices.controller";
import { BuyerPricesService } from "./services/buyer-prices.service";
import { BuyerPrice } from "./entities/buyer-price.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BuyerPrice])],
  controllers: [BuyerPricesController],
  providers: [BuyerPricesService],
  exports: [BuyerPricesService],
})
export class BuyerPricesModule {}
