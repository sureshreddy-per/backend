import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionService } from './services/transaction.service';
import { OffersModule } from '../offers/offers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProduceModule } from '../produce/produce.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    OffersModule,
    NotificationsModule,
    ProduceModule,
  ],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionsModule {} 