import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Farmer } from "./entities/farmer.entity";
import { Farm } from "./entities/farm.entity";
import { BankAccount } from "./entities/bank-account.entity";
import { FarmersService } from "./farmers.service";
import { FarmersController } from "./farmers.controller";
import { UsersModule } from "../users/users.module";
import { User } from "../users/entities/user.entity";
import { Offer } from "../offers/entities/offer.entity";
import { ConfigModule } from "../config/config.module";
import { Produce } from "../produce/entities/produce.entity";
import { InspectionRequest } from "../quality/entities/inspection-request.entity";
import { Transaction } from "../transactions/entities/transaction.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Farmer, 
      Farm, 
      BankAccount, 
      User, 
      Offer,
      Produce,
      InspectionRequest,
      Transaction
    ]),
    UsersModule,
    ConfigModule,
  ],
  providers: [FarmersService],
  controllers: [FarmersController],
  exports: [FarmersService],
})
export class FarmersModule {}
