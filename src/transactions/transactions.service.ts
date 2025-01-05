import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { ProduceStatus } from '../produce/enums/produce-status.enum';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ProduceService } from '../produce/produce.service';
import { TransactionsGateway } from './transactions.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TransactionMetadata } from './interfaces/transaction-metadata.interface';

@Injectable()
export class TransactionsService {
  private readonly MAX_ACTIVE_TRANSACTIONS = 10;
  private readonly MIN_QUANTITY = 0.01;
  private readonly MAX_QUANTITY = 1000000; // 1 million units
  private readonly MAX_TRANSACTIONS_PER_PAGE = 50;

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly produceService: ProduceService,
    private readonly transactionsGateway: TransactionsGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, buyerId: string): Promise<Transaction> {
    // Validate quantity
    if (createTransactionDto.quantity <= this.MIN_QUANTITY) {
      throw new BadRequestException(`Quantity must be greater than ${this.MIN_QUANTITY}`);
    }

    if (createTransactionDto.quantity > this.MAX_QUANTITY) {
      throw new BadRequestException(`Quantity cannot exceed ${this.MAX_QUANTITY}`);
    }

    // Check active transactions limit
    const activeTransactions = await this.transactionRepository.count({
      where: {
        buyerId,
        status: TransactionStatus.PENDING,
      },
    });

    if (activeTransactions >= this.MAX_ACTIVE_TRANSACTIONS) {
      throw new BadRequestException(
        `Maximum limit of ${this.MAX_ACTIVE_TRANSACTIONS} active transactions reached`
      );
    }

    try {
      const produce = await this.produceService.findOne(createTransactionDto.produceId);

      // Validate produce status
      if (produce.status !== ProduceStatus.IN_PROGRESS) {
        throw new BadRequestException('Cannot create transaction for this produce');
      }

      // Validate quantity against available produce
      if (createTransactionDto.quantity > produce.quantity) {
        throw new BadRequestException('Requested quantity exceeds available produce quantity');
      }

      // Check for existing transaction
      const existingTransaction = await this.transactionRepository.findOne({
        where: {
          buyerId,
          produceId: createTransactionDto.produceId,
          status: TransactionStatus.PENDING,
        },
      });

      if (existingTransaction) {
        throw new ConflictException('An active transaction already exists for this produce');
      }

      const metadata: TransactionMetadata = {
        priceAtTransaction: produce.price,
        qualityGrade: produce.qualityGrade,
        notes: createTransactionDto.notes || '',
      };

      const transactionData: DeepPartial<Transaction> = {
        ...createTransactionDto,
        buyerId,
        status: TransactionStatus.PENDING,
        metadata,
      };

      const transaction = this.transactionRepository.create(transactionData);
      const savedTransaction = await this.transactionRepository.save(transaction);
      const transactionWithRelations = await this.findOne(savedTransaction.id);

      // Emit events
      this.eventEmitter.emit('transaction.created', {
        transactionId: transactionWithRelations.id,
        buyerId,
        produceId: produce.id,
        quantity: createTransactionDto.quantity,
      });

      // Notify through WebSocket
      this.transactionsGateway.notifyNewTransaction(transactionWithRelations);

      return transactionWithRelations;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create transaction');
    }
  }

  async findAll(page = 1, limit = 10): Promise<{ items: Transaction[]; meta: any }> {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }

    if (limit < 1 || limit > this.MAX_TRANSACTIONS_PER_PAGE) {
      throw new BadRequestException(`Limit must be between 1 and ${this.MAX_TRANSACTIONS_PER_PAGE}`);
    }

    try {
      const [items, total] = await this.transactionRepository.findAndCount({
        relations: ['buyer', 'produce'],
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch transactions');
    }
  }

  async findOne(id: string): Promise<Transaction> {
    if (!id) {
      throw new BadRequestException('Transaction ID is required');
    }

    try {
      const transaction = await this.transactionRepository.findOne({
        where: { id },
        relations: ['buyer', 'produce', 'produce.farmer'],
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      return transaction;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch transaction details');
    }
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id);

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Can only update pending transactions');
    }

    // Validate quantity if provided
    if (updateTransactionDto.quantity !== undefined) {
      if (updateTransactionDto.quantity <= this.MIN_QUANTITY) {
        throw new BadRequestException(`Quantity must be greater than ${this.MIN_QUANTITY}`);
      }

      if (updateTransactionDto.quantity > this.MAX_QUANTITY) {
        throw new BadRequestException(`Quantity cannot exceed ${this.MAX_QUANTITY}`);
      }

      // Validate against available produce quantity
      if (updateTransactionDto.quantity > transaction.produce.quantity) {
        throw new BadRequestException('Requested quantity exceeds available produce quantity');
      }
    }

    try {
      const updatedData: DeepPartial<Transaction> = {
        id: transaction.id,
        ...updateTransactionDto,
        status: transaction.status,
      };

      const updatedTransaction = await this.transactionRepository.save(updatedData);
      const refreshedTransaction = await this.findOne(updatedTransaction.id);

      this.eventEmitter.emit('transaction.updated', {
        transactionId: refreshedTransaction.id,
        buyerId: refreshedTransaction.buyerId,
        produceId: refreshedTransaction.produceId,
      });

      return refreshedTransaction;
    } catch (error) {
      throw new BadRequestException('Failed to update transaction');
    }
  }

  async cancel(id: string, reason: string): Promise<Transaction> {
    if (!reason) {
      throw new BadRequestException('Cancellation reason is required');
    }

    const transaction = await this.findOne(id);

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending transactions');
    }

    try {
      const updatedData: DeepPartial<Transaction> = {
        id: transaction.id,
        status: TransactionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      };

      const cancelledTransaction = await this.transactionRepository.save(updatedData);
      const refreshedTransaction = await this.findOne(cancelledTransaction.id);

      this.eventEmitter.emit('transaction.cancelled', {
        transactionId: refreshedTransaction.id,
        buyerId: refreshedTransaction.buyerId,
        produceId: refreshedTransaction.produceId,
        reason,
      });

      return refreshedTransaction;
    } catch (error) {
      throw new BadRequestException('Failed to cancel transaction');
    }
  }

  async complete(id: string): Promise<Transaction> {
    const transaction = await this.findOne(id);

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Can only complete pending transactions');
    }

    try {
      const updatedData: DeepPartial<Transaction> = {
        id: transaction.id,
        status: TransactionStatus.COMPLETED,
        completedAt: new Date(),
      };

      const completedTransaction = await this.transactionRepository.save(updatedData);
      const refreshedTransaction = await this.findOne(completedTransaction.id);

      this.eventEmitter.emit('transaction.completed', {
        transactionId: refreshedTransaction.id,
        buyerId: refreshedTransaction.buyerId,
        produceId: refreshedTransaction.produceId,
      });

      return refreshedTransaction;
    } catch (error) {
      throw new BadRequestException('Failed to complete transaction');
    }
  }

  async findByBuyer(buyerId: string, page = 1, limit = 10): Promise<{ items: Transaction[]; meta: any }> {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }

    if (limit < 1 || limit > this.MAX_TRANSACTIONS_PER_PAGE) {
      throw new BadRequestException(`Limit must be between 1 and ${this.MAX_TRANSACTIONS_PER_PAGE}`);
    }

    try {
      const [items, total] = await this.transactionRepository.findAndCount({
        where: { buyerId },
        relations: ['produce', 'produce.farmer'],
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch buyer transactions');
    }
  }
} 