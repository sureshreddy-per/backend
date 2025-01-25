import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BaseService } from "../../common/base.service";
import { TransactionHistory } from "../entities/transaction-history.entity";
import { TransactionEvent } from "../entities/transaction-history.entity";
import { TransactionStatus } from "../entities/transaction.entity";

@Injectable()
export class TransactionHistoryService extends BaseService<TransactionHistory> {
  constructor(
    @InjectRepository(TransactionHistory)
    private readonly transactionHistoryRepository: Repository<TransactionHistory>,
  ) {
    super(transactionHistoryRepository);
  }

  async findLatestHistories(transactionId: string) {
    return this.transactionHistoryRepository.find({
      where: { transactionId },
      order: { created_at: "DESC" },
      take: 10,
    });
  }

  async createHistoryEntry(
    transactionId: string,
    event: TransactionEvent,
    userId: string,
    oldStatus?: TransactionStatus,
    newStatus?: TransactionStatus,
    metadata?: Record<string, any>
  ): Promise<TransactionHistory> {
    const historyEntry = this.transactionHistoryRepository.create({
      transactionId,
      event,
      userId,
      oldStatus,
      newStatus,
      metadata
    });

    return this.transactionHistoryRepository.save(historyEntry);
  }

  async createStatusChangeEntry(
    transactionId: string,
    userId: string,
    oldStatus: TransactionStatus,
    newStatus: TransactionStatus,
    metadata?: Record<string, any>
  ): Promise<TransactionHistory> {
    return this.createHistoryEntry(
      transactionId,
      TransactionEvent.STATUS_CHANGED,
      userId,
      oldStatus,
      newStatus,
      metadata
    );
  }
}
