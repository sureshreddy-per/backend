import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "./entities/transaction.entity";
import { TransactionHistory } from "./entities/transaction-history.entity";
import { TransactionService } from "./services/transaction.service";
import { TransactionHistoryService } from "./services/transaction-history.service";
import { TransactionTasksService } from "./tasks/transaction-tasks.service";
import { TransactionsController } from "./controllers/transactions.controller";
import { OffersModule } from "../offers/offers.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ProduceModule } from '../produce/produce.module';
import { RatingsModule } from "../ratings/ratings.module";
import { ScheduleModule } from "@nestjs/schedule";
import { BuyersModule } from "../buyers/buyers.module";
import { FarmersModule } from "../farmers/farmers.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionHistory]),
    OffersModule,
    NotificationsModule,
    ProduceModule,
    BuyersModule,
    FarmersModule,
    forwardRef(() => RatingsModule),
    ScheduleModule.forRoot(),
  ],
  controllers: [TransactionsController],
  providers: [TransactionService, TransactionHistoryService, TransactionTasksService],
  exports: [TransactionService, TransactionHistoryService],
})
export class TransactionsModule {}
