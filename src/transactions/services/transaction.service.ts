import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { BaseService } from '../../common/base.service';

@Injectable()
export class TransactionService extends BaseService<Transaction> {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>
  ) {
    super(transactionRepository);
  }

  async findOne(options: FindManyOptions<Transaction> | string) {
    if (typeof options === 'string') {
      return this.transactionRepository.findOne({ where: { id: options } });
    }
    return this.transactionRepository.findOne(options);
  }

  async cancel(id: string, reason: string) {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    transaction.status = TransactionStatus.CANCELLED;
    transaction.metadata = {
      ...transaction.metadata,
      cancelled_at: new Date(),
      cancellation_reason: reason
    };
    return this.transactionRepository.save(transaction);
  }

  async calculateTotalValue() {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.final_price * transaction.final_quantity)', 'total')
      .where('transaction.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();
    
    return result?.total || 0;
  }
} 