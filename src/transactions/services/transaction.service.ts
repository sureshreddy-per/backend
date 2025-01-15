import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository, LessThan, IsNull } from "typeorm";
import { Transaction, TransactionStatus } from "../entities/transaction.entity";
import { BaseService } from "../../common/base.service";
import { PaginatedResponse } from "../../common/interfaces/paginated-response.interface";

@Injectable()
export class TransactionService extends BaseService<Transaction> {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {
    super(transactionRepository);
  }

  async findOne(options: FindManyOptions<Transaction> | string) {
    if (typeof options === "string") {
      return this.transactionRepository.findOne({ where: { id: options } });
    }
    return this.transactionRepository.findOne(options);
  }

  async findAll(
    options: FindManyOptions<Transaction>,
  ): Promise<PaginatedResponse<Transaction>> {
    const [items, total] =
      await this.transactionRepository.findAndCount(options);
    const { take = 10, skip = 0 } = options;
    const page = Math.floor(skip / take) + 1;
    const totalPages = Math.ceil(total / take);

    return {
      items,
      total,
      page,
      limit: take,
      totalPages,
    };
  }

  async startDeliveryWindow(id: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    transaction.status = TransactionStatus.IN_PROGRESS;
    transaction.delivery_window_starts_at = now;
    transaction.delivery_window_ends_at = endTime;
    transaction.metadata = {
      ...transaction.metadata,
      delivery_notes: `Delivery window started at ${now.toISOString()}`,
    };

    return this.transactionRepository.save(transaction);
  }

  async confirmDelivery(id: string, notes?: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    const now = new Date();
    transaction.status = TransactionStatus.IN_PROGRESS;
    transaction.delivery_confirmed_at = now;
    transaction.metadata = {
      ...transaction.metadata,
      delivery_notes: notes || `Delivery confirmed at ${now.toISOString()}`,
    };

    return this.transactionRepository.save(transaction);
  }

  async confirmBuyerInspection(
    id: string,
    notes?: string,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    transaction.buyer_inspection_completed_at = new Date();
    transaction.metadata = {
      ...transaction.metadata,
      inspection_notes: notes,
    };

    return this.transactionRepository.save(transaction);
  }

  async checkDeliveryWindows(): Promise<void> {
    const expiredTransactions = await this.transactionRepository.find({
      where: {
        status: TransactionStatus.IN_PROGRESS,
        delivery_window_ends_at: LessThan(new Date()),
        delivery_confirmed_at: IsNull(),
      },
    });

    for (const transaction of expiredTransactions) {
      transaction.status = TransactionStatus.EXPIRED;
      await this.transactionRepository.save(transaction);
    }
  }

  async reactivateExpiredTransaction(id: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    if (transaction.status !== TransactionStatus.EXPIRED) {
      throw new Error("Only expired transactions can be reactivated");
    }

    return this.startDeliveryWindow(id);
  }

  async completeTransaction(id: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    transaction.status = TransactionStatus.COMPLETED;
    transaction.metadata = {
      ...transaction.metadata,
      completed_at: new Date(),
    };

    // Set requires_rating to true when transaction is completed
    transaction.requires_rating = true;
    transaction.rating_completed = false;

    return this.transactionRepository.save(transaction);
  }

  async cancel(id: string, reason: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    transaction.status = TransactionStatus.CANCELLED;
    transaction.metadata = {
      ...transaction.metadata,
      cancelled_at: new Date(),
      cancellation_reason: reason,
    };

    return this.transactionRepository.save(transaction);
  }

  async calculateTotalValue() {
    const result = await this.transactionRepository
      .createQueryBuilder("transaction")
      .select(
        "SUM(transaction.final_price * transaction.final_quantity)",
        "total",
      )
      .where("transaction.status = :status", {
        status: TransactionStatus.COMPLETED,
      })
      .getRawOne();

    return result?.total || 0;
  }

  async count(): Promise<number> {
    return this.transactionRepository.count();
  }

  async countByStatus(status: TransactionStatus): Promise<number> {
    return this.transactionRepository.count({ where: { status } });
  }

  async getStats() {
    const [
      totalTransactions,
      pendingTransactions,
      inProgressTransactions,
      completedTransactions,
      cancelledTransactions,
      expiredTransactions,
      totalValue,
    ] = await Promise.all([
      this.count(),
      this.countByStatus(TransactionStatus.PENDING),
      this.countByStatus(TransactionStatus.IN_PROGRESS),
      this.countByStatus(TransactionStatus.COMPLETED),
      this.countByStatus(TransactionStatus.CANCELLED),
      this.countByStatus(TransactionStatus.EXPIRED),
      this.calculateTotalValue(),
    ]);

    return {
      total: totalTransactions,
      pending: pendingTransactions,
      in_progress: inProgressTransactions,
      completed: completedTransactions,
      cancelled: cancelledTransactions,
      expired: expiredTransactions,
      total_value: totalValue,
    };
  }

  async getRevenueStats() {
    const result = await this.transactionRepository
      .createQueryBuilder("transaction")
      .select([
        "DATE_TRUNC('month', transaction.created_at) as month",
        "SUM(transaction.final_price * transaction.final_quantity) as revenue",
        "COUNT(*) as count",
      ])
      .where("transaction.status = :status", {
        status: TransactionStatus.COMPLETED,
      })
      .groupBy("month")
      .orderBy("month", "DESC")
      .limit(12)
      .getRawMany();

    return result.map((item) => ({
      month: item.month,
      revenue: parseFloat(item.revenue) || 0,
      count: parseInt(item.count),
    }));
  }
}
