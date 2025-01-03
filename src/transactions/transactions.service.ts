import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ProduceService } from '../produce/produce.service';
import { ProduceStatus } from '../produce/entities/produce.entity';
import { TransactionsGateway } from './transactions.gateway';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly produceService: ProduceService,
    private readonly transactionsGateway: TransactionsGateway,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, buyerId: string): Promise<Transaction> {
    const produce = await this.produceService.findOne(createTransactionDto.produceId);

    if (produce.status !== ProduceStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot create transaction for this produce');
    }

    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      buyerId,
      status: TransactionStatus.PENDING,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);
    const transactionWithRelations = await this.findOne(savedTransaction.id);

    // Notify about the new transaction
    this.transactionsGateway.notifyNewTransaction(transactionWithRelations);

    return transactionWithRelations;
  }

  async findAll(page = 1, limit = 10) {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['buyer', 'produce'],
      order: { createdAt: 'DESC' },
    });

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['buyer', 'produce'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id);
    const updatedTransaction = Object.assign(transaction, updateTransactionDto);
    const savedTransaction = await this.transactionRepository.save(updatedTransaction);

    // Notify about the transaction update
    this.transactionsGateway.notifyTransactionStatusUpdate(savedTransaction);

    return savedTransaction;
  }

  async findByBuyer(buyerId: string, page = 1, limit = 10) {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { buyerId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['produce'],
      order: { createdAt: 'DESC' },
    });

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    const transaction = await this.findOne(id);
    transaction.status = status;

    if (status === TransactionStatus.COMPLETED) {
      await this.produceService.updateStatus(transaction.produceId, ProduceStatus.COMPLETED);
    }

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Notify about the status update
    this.transactionsGateway.notifyTransactionStatusUpdate(savedTransaction);

    return savedTransaction;
  }
} 