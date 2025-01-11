import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  TransactionHistory,
  TransactionEvent,
} from "../entities/transaction-history.entity";
import { Transaction, TransactionStatus } from "../entities/transaction.entity";
import { BaseService } from "../../common/base.service";

@Injectable()
export class TransactionHistoryService extends BaseService<TransactionHistory> {
  constructor(
    @InjectRepository(TransactionHistory)
    private readonly historyRepository: Repository<TransactionHistory>,
  ) {
    super(historyRepository);
  }

  async logStatusChange(
    transaction: Transaction,
    oldStatus: TransactionStatus,
    newStatus: TransactionStatus,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<TransactionHistory> {
    return this.create({
      transactionId: transaction.id,
      event: TransactionEvent.STATUS_CHANGED,
      oldStatus,
      newStatus,
      userId,
      metadata,
    });
  }

  async logEvent(
    transaction: Transaction,
    event: TransactionEvent,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<TransactionHistory> {
    return this.create({
      transactionId: transaction.id,
      event,
      userId,
      metadata,
    });
  }

  async getTransactionHistory(
    transactionId: string,
  ): Promise<TransactionHistory[]> {
    return this.historyRepository.find({
      where: { transactionId },
      order: { createdAt: "DESC" },
    });
  }
}
