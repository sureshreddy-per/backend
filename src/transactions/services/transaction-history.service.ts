import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BaseService } from "../../common/base.service";
import { TransactionHistory } from "../entities/transaction-history.entity";

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
}
