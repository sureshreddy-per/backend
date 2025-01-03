import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsGateway } from './transactions.gateway';
import { Transaction } from './entities/transaction.entity';
import { ProduceModule } from '../produce/produce.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    ProduceModule,
    AuthModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsGateway],
  exports: [TransactionsService],
})
export class TransactionsModule {} 