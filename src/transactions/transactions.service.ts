import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionRepository.create(createTransactionDto);
    return this.transactionRepository.save(transaction);
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResponse<Transaction>> {
    const [items, total] = await this.transactionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['farmer', 'buyer', 'produce', 'offer'],
      order: { created_at: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['farmer', 'buyer', 'produce', 'offer'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async findByBuyer(buyerId: string, page = 1, limit = 10): Promise<PaginatedResponse<Transaction>> {
    const [items, total] = await this.transactionRepository.findAndCount({
      where: { buyer_id: buyerId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['farmer', 'buyer', 'produce', 'offer'],
      order: { created_at: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
} 