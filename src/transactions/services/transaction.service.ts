import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository, LessThan, IsNull, Between, In } from "typeorm";
import { Transaction, TransactionStatus } from "../entities/transaction.entity";
import { BaseService } from "../../common/base.service";
import { PaginatedResponse } from "../../common/interfaces/paginated-response.interface";
import { User } from "../../users/entities/user.entity";
import { Buyer } from "../../buyers/entities/buyer.entity";
import { Farmer } from "../../farmers/entities/farmer.entity";
import { TransactionHistoryService } from "./transaction-history.service";
import { TransactionEvent } from "../entities/transaction-history.entity";
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { OfferAcceptedEvent } from '../../offers/events/offer-accepted.event';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TransactionExpiredEvent, GetLatestTransactionEvent } from '../../offers/services/offers.service';
import { BuyersService } from '../../buyers/buyers.service';
import { FarmersService } from '../../farmers/farmers.service';

export interface TransformedBuyer {
  id: string;
  business_name: string;
  address: string;
  location: string;
  name: string;
  avatar_url: string;
  rating: number;
  mobile_number: string;
  total_completed_transactions: number;
}

export interface TransformedFarmer {
  id: string;
  name: string;
  avatar_url: string;
  rating: number;
  mobile_number: string;
  total_completed_transactions: number;
}

export interface TransformedProduce {
  id: string;
  name: string;
  quality_grade: number;
}

export interface TransformedTransaction {
  id: string;
  offer_id: string;
  produce_id: string;
  buyer_id: string;
  farmer_id: string;
  final_price: number;
  final_quantity: number;
  status: TransactionStatus;
  delivery_window_starts_at: Date | null;
  delivery_window_ends_at: Date | null;
  delivery_confirmed_at: Date | null;
  buyer_inspection_completed_at: Date | null;
  distance_km: number;
  created_at: Date;
  updated_at: Date;
  requires_rating: boolean;
  rating_completed: boolean;
  produce: TransformedProduce;
  buyer?: TransformedBuyer;
  farmer?: TransformedFarmer;
}

@Injectable()
export class TransactionService extends BaseService<Transaction> {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly transactionHistoryService: TransactionHistoryService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
    private readonly buyersService: BuyersService,
    private readonly farmersService: FarmersService,
  ) {
    super(transactionRepository);
  }

  private transformTransactionResponse(transaction: Transaction, userRole: string): TransformedTransaction {
    const transformedTransaction: TransformedTransaction = {
      id: transaction.id,
      offer_id: transaction.offer_id,
      produce_id: transaction.produce_id,
      buyer_id: transaction.buyer_id,
      farmer_id: transaction.farmer_id,
      final_price: transaction.final_price,
      final_quantity: transaction.final_quantity,
      status: transaction.status,
      delivery_window_starts_at: transaction.delivery_window_starts_at,
      delivery_window_ends_at: transaction.delivery_window_ends_at,
      delivery_confirmed_at: transaction.delivery_confirmed_at,
      buyer_inspection_completed_at: transaction.buyer_inspection_completed_at,
      distance_km: 0, // This needs to be calculated based on location
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
      requires_rating: transaction.requires_rating,
      rating_completed: transaction.rating_completed,
      produce: transaction.produce ? {
        id: transaction.produce.id,
        name: transaction.produce.name,
        quality_grade: transaction.produce.quality_grade || 0
      } : null
    };

    // Add buyer or farmer details based on role
    if (userRole === 'FARMER' && transaction.offer?.buyer?.user) {
      const buyer = transaction.offer.buyer;
      const user = buyer.user;
      transformedTransaction.buyer = {
        id: buyer.id,
        business_name: buyer.business_name || '',
        address: buyer.address || '',
        location: buyer.location || '',
        name: user.name || '',
        avatar_url: user.avatar_url || '',
        rating: user.rating || 0,
        mobile_number: user.mobile_number || '',
        total_completed_transactions: user.total_completed_transactions || 0
      };
    } else if (userRole === 'BUYER' && transaction.offer?.produce?.farmer?.user) {
      const farmer = transaction.offer.produce.farmer;
      const user = farmer.user;
      transformedTransaction.farmer = {
        id: farmer.id,
        name: user.name || '',
        avatar_url: user.avatar_url || '',
        rating: user.rating || 0,
        mobile_number: user.mobile_number || '',
        total_completed_transactions: user.total_completed_transactions || 0
      };
    }

    return transformedTransaction;
  }

  // Public methods for transformed responses
  async findOneAndTransform(id: string, userRole: string): Promise<TransformedTransaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      return null;
    }
    return this.transformTransactionResponse(transaction, userRole);
  }

  async findAllAndTransform(
    options: FindManyOptions<Transaction>,
    userRole: string,
  ): Promise<PaginatedResponse<TransformedTransaction>> {
    const [items, total] = await this.transactionRepository.findAndCount({
      ...options,
      relations: [
        'offer',
        'offer.buyer',
        'offer.buyer.user',
        'offer.produce',
        'offer.produce.farmer',
        'offer.produce.farmer.user',
        'produce'
      ]
    });

    const { take = 10, skip = 0 } = options;
    const page = Math.floor(skip / take) + 1;
    const totalPages = Math.ceil(total / take);

    return {
      items: items.map(item => this.transformTransactionResponse(item, userRole)),
      total,
      page,
      limit: take,
      totalPages,
    };
  }

  // Original methods remain unchanged
  async findOne(id: string): Promise<Transaction>;
  async findOne(options: FindManyOptions<Transaction>): Promise<Transaction>;
  async findOne(options: FindManyOptions<Transaction> | string): Promise<Transaction> {
    let transaction: Transaction;
    if (typeof options === "string") {
      transaction = await this.transactionRepository.findOne({
        where: { id: options },
        relations: [
          'offer',
          'offer.buyer',
          'offer.buyer.user',
          'offer.produce',
          'offer.produce.farmer',
          'offer.produce.farmer.user',
          'produce'
        ]
      });
    } else {
      transaction = await this.transactionRepository.findOne({
        ...options,
        relations: [
          'offer',
          'offer.buyer',
          'offer.buyer.user',
          'offer.produce',
          'offer.produce.farmer',
          'offer.produce.farmer.user',
          'produce'
        ]
      });
    }

    return transaction;
  }

  async findAll(options?: FindManyOptions<Transaction>): Promise<PaginatedResponse<Transaction>>;
  async findAll(options: FindManyOptions<Transaction>, userRole: string): Promise<PaginatedResponse<TransformedTransaction>>;
  async findAll(
    options?: FindManyOptions<Transaction>,
    userRole?: string,
  ): Promise<PaginatedResponse<Transaction> | PaginatedResponse<TransformedTransaction>> {
    const [items, total] = await this.transactionRepository.findAndCount({
      ...options,
      relations: [
        'offer',
        'offer.buyer',
        'offer.buyer.user',
        'offer.produce',
        'offer.produce.farmer',
        'offer.produce.farmer.user',
        'produce'
      ]
    });

    const { take = 10, skip = 0 } = options || {};
    const page = Math.floor(skip / take) + 1;
    const totalPages = Math.ceil(total / take);

    if (userRole) {
      return {
        items: items.map(item => this.transformTransactionResponse(item, userRole)),
        total,
        page,
        limit: take,
        totalPages,
      };
    }

    return {
      items,
      total,
      page,
      limit: take,
      totalPages,
    };
  }

  async startDeliveryWindow(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    const oldStatus = transaction.status;
    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    transaction.status = TransactionStatus.IN_PROGRESS;
    transaction.delivery_window_starts_at = now;
    transaction.delivery_window_ends_at = endTime;
    transaction.metadata = {
      ...transaction.metadata,
      delivery_notes: `Delivery window started at ${now.toISOString()}`,
    };

    const savedTransaction = await this.transactionRepository.save(transaction);

    await this.transactionHistoryService.createHistoryEntry(
      id,
      TransactionEvent.DELIVERY_WINDOW_STARTED,
      userId,
      oldStatus,
      TransactionStatus.IN_PROGRESS,
      { delivery_window_starts_at: now, delivery_window_ends_at: endTime }
    );

    return savedTransaction;
  }

  async confirmDelivery(id: string, userId: string, notes?: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    const oldStatus = transaction.status;
    const now = new Date();
    transaction.status = TransactionStatus.IN_PROGRESS;
    transaction.delivery_confirmed_at = now;
    transaction.metadata = {
      ...transaction.metadata,
      delivery_notes: notes || `Delivery confirmed at ${now.toISOString()}`,
    };

    const savedTransaction = await this.transactionRepository.save(transaction);

    await this.transactionHistoryService.createHistoryEntry(
      id,
      TransactionEvent.DELIVERY_CONFIRMED,
      userId,
      oldStatus,
      TransactionStatus.IN_PROGRESS,
      { delivery_confirmed_at: now, notes }
    );

    return savedTransaction;
  }

  async confirmBuyerInspection(
    id: string,
    userId: string,
    notes?: string,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    const now = new Date();
    transaction.buyer_inspection_completed_at = now;
    transaction.metadata = {
      ...transaction.metadata,
      inspection_notes: notes,
    };

    const savedTransaction = await this.transactionRepository.save(transaction);

    await this.transactionHistoryService.createHistoryEntry(
      id,
      TransactionEvent.INSPECTION_COMPLETED,
      userId,
      transaction.status,
      transaction.status,
      { buyer_inspection_completed_at: now, notes }
    );

    return savedTransaction;
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

      await this.transactionHistoryService.createHistoryEntry(
        transaction.id,
        TransactionEvent.STATUS_CHANGED,
        'system', // System-triggered change
        TransactionStatus.IN_PROGRESS,
        TransactionStatus.EXPIRED,
        { reason: 'Delivery window expired without confirmation' }
      );
    }
  }

  async reactivateExpiredTransaction(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    if (transaction.status !== TransactionStatus.EXPIRED) {
      throw new Error("Only expired transactions can be reactivated");
    }

    const oldStatus = transaction.status;
    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    transaction.status = TransactionStatus.IN_PROGRESS;
    transaction.delivery_window_starts_at = now;
    transaction.delivery_window_ends_at = endTime;
    transaction.metadata = {
      ...transaction.metadata,
      reactivated_at: now,
      delivery_notes: `Delivery window restarted at ${now.toISOString()}`,
    };

    const savedTransaction = await this.transactionRepository.save(transaction);

    await this.transactionHistoryService.createHistoryEntry(
      id,
      TransactionEvent.DELIVERY_WINDOW_STARTED,
      userId,
      oldStatus,
      TransactionStatus.IN_PROGRESS,
      {
        reactivated_at: now,
        delivery_window_starts_at: now,
        delivery_window_ends_at: endTime
      }
    );

    return savedTransaction;
  }

  private async incrementUserTransactionCount(userId: string): Promise<void> {
    await this.userRepository.increment(
      { id: userId },
      'total_completed_transactions',
      1
    );
  }

  async completeTransaction(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    const oldStatus = transaction.status;
    const now = new Date();
    transaction.status = TransactionStatus.COMPLETED;
    transaction.metadata = {
      ...transaction.metadata,
      completed_at: now,
    };

    transaction.requires_rating = true;
    transaction.rating_completed = false;

    const savedTransaction = await this.transactionRepository.save(transaction);

    await Promise.all([
      this.incrementUserTransactionCount(transaction.buyer_id),
      this.incrementUserTransactionCount(transaction.farmer_id),
      this.transactionHistoryService.createHistoryEntry(
        id,
        TransactionEvent.STATUS_CHANGED,
        userId,
        oldStatus,
        TransactionStatus.COMPLETED,
        { completed_at: now }
      )
    ]);

    return savedTransaction;
  }

  async cancel(id: string, userId: string, reason: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    const oldStatus = transaction.status;
    const now = new Date();
    transaction.status = TransactionStatus.CANCELLED;
    transaction.metadata = {
      ...transaction.metadata,
      cancelled_at: now,
      cancellation_reason: reason,
    };

    const savedTransaction = await this.transactionRepository.save(transaction);

    await this.transactionHistoryService.createHistoryEntry(
      id,
      TransactionEvent.STATUS_CHANGED,
      userId,
      oldStatus,
      TransactionStatus.CANCELLED,
      { cancelled_at: now, reason }
    );

    return savedTransaction;
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
    return this.transactionRepository.count({
      where: { status }
    });
  }

  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      cancelledTransactions,
      recentTransactions,
      totalValue
    ] = await Promise.all([
      this.count(),
      this.countByStatus(TransactionStatus.COMPLETED),
      this.countByStatus(TransactionStatus.PENDING),
      this.countByStatus(TransactionStatus.CANCELLED),
      this.transactionRepository.count({
        where: {
          created_at: Between(thirtyDaysAgo, now)
        }
      }),
      this.calculateTotalValue()
    ]);

    return {
      total: totalTransactions,
      completed: completedTransactions,
      pending: pendingTransactions,
      cancelled: cancelledTransactions,
      recent: recentTransactions,
      total_value: totalValue,
      completion_rate: totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0,
      cancellation_rate: totalTransactions > 0 ? (cancelledTransactions / totalTransactions) * 100 : 0
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

  async create(data: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.transactionRepository.create(data);
    const savedTransaction = await this.transactionRepository.save(transaction);

    // Record creation in history
    await this.transactionHistoryService.createHistoryEntry(
      savedTransaction.id,
      TransactionEvent.CREATED,
      data.buyer_id, // Use buyer_id as the creator since they initiate transactions
      null,
      TransactionStatus.PENDING,
      {
        offer_id: data.offer_id,
        produce_id: data.produce_id,
        final_price: data.final_price,
        final_quantity: data.final_quantity
      }
    );

    return savedTransaction;
  }

  @OnEvent('offer.accepted')
  async handleOfferAccepted(event: OfferAcceptedEvent) {
    this.logger.log(`Received offer.accepted event for offer ${event.offer_id}`);
    try {
      // 1. Create transaction with validated metadata
      const metadata = {
        quality_grade: event.quality_grade || 'N/A',
        inspection_notes: `Distance: ${event.distance_km || 'unknown'}km, Inspection Fee: ${event.inspection_fee || 0}`,
        ...event.metadata
      };

      this.logger.log(`Creating transaction for offer ${event.offer_id}`);
      const newTransaction = this.transactionRepository.create({
        offer_id: event.offer_id,
        produce_id: event.produce_id,
        buyer_id: event.buyer_id,
        farmer_id: event.farmer_id,
        final_price: event.price_per_unit,
        final_quantity: event.quantity,
        status: TransactionStatus.PENDING,
        requires_rating: true,
        rating_completed: false,
        inspection_fee_paid: false,
        metadata
      });

      const savedTransaction = await this.transactionRepository.save(newTransaction);
      this.logger.log(`Created transaction ${savedTransaction.id} for offer ${event.offer_id}`);

      // 2. Create transaction history
      try {
        await this.transactionHistoryService.createHistoryEntry(
          String(savedTransaction.id),
          TransactionEvent.CREATED,
          event.farmer_id,
          null,
          TransactionStatus.PENDING,
          {
            offer_id: event.offer_id,
            accepted_at: event.metadata.accepted_at,
            accepted_by: event.metadata.accepted_by
          }
        );
      } catch (error) {
        this.logger.error(`Failed to create history entry for transaction ${savedTransaction.id}`, error);
        // Retry through event
        this.eventEmitter.emit('transaction.history.retry', {
          transactionId: savedTransaction.id,
          event: TransactionEvent.CREATED,
          actorId: event.farmer_id,
          status: TransactionStatus.PENDING,
          metadata: {
            offer_id: event.offer_id,
            accepted_at: event.metadata.accepted_at,
            accepted_by: event.metadata.accepted_by
          }
        });
      }

      // 3. Send notification
      try {
        await this.notificationService.create({
          user_id: event.buyer_user_id,
          type: NotificationType.OFFER_ACCEPTED,
          data: {
            offer_id: event.offer_id,
            produce_id: event.produce_id,
            transaction_id: String(savedTransaction.id)
          },
        });
      } catch (error) {
        this.logger.error(`Failed to send acceptance notification to buyer ${event.buyer_user_id}`, error);
        // Retry through event
        this.eventEmitter.emit('notification.retry', {
          userId: event.buyer_user_id,
          type: NotificationType.OFFER_ACCEPTED,
          data: {
            offer_id: event.offer_id,
            produce_id: event.produce_id,
            transaction_id: savedTransaction.id
          }
        });
      }
    } catch (error) {
      this.logger.error('Failed to process offer.accepted event', error);
      throw error;
    }
  }

  @OnEvent('transaction.expired')
  async handleTransactionExpired(event: TransactionExpiredEvent) {
    try {
      const transaction = await this.findOne(event.transaction_id);
      if (!transaction) {
        throw new NotFoundException(`Transaction ${event.transaction_id} not found`);
      }

      transaction.status = TransactionStatus.CANCELLED;
      transaction.metadata = {
        ...transaction.metadata,
        ...event.metadata,
        cancellation_reason: event.metadata.reason
      };

      const savedTransaction = await this.transactionRepository.save(transaction);

      // Create history entry
      await this.transactionHistoryService.createHistoryEntry(
        savedTransaction.id,
        TransactionEvent.STATUS_CHANGED,
        event.metadata.reactivated_by,
        TransactionStatus.PENDING,
        TransactionStatus.CANCELLED,
        event.metadata
      );

      // Send notifications
      const [buyer, farmer] = await Promise.all([
        this.buyersService.findOne(transaction.buyer_id),
        this.farmersService.findOne(transaction.farmer_id)
      ]);

      if (buyer && farmer) {
        await Promise.all([
          this.notificationService.create({
            user_id: buyer.user_id,
            type: NotificationType.TRANSACTION_CANCELLED,
            data: {
              transaction_id: transaction.id,
              produce_id: transaction.produce_id,
              status: TransactionStatus.CANCELLED,
              reason: event.metadata.reason
            }
          }),
          this.notificationService.create({
            user_id: farmer.user_id,
            type: NotificationType.TRANSACTION_CANCELLED,
            data: {
              transaction_id: transaction.id,
              produce_id: transaction.produce_id,
              status: TransactionStatus.CANCELLED,
              reason: event.metadata.reason
            }
          })
        ]);
      }
    } catch (error) {
      this.logger.error(`Failed to handle transaction.expired event for ${event.transaction_id}`, error);
      throw error;
    }
  }

  @OnEvent('produce.transaction.latest.requested')
  async handleLatestTransactionRequest(event: GetLatestTransactionEvent) {
    try {
      const transaction = await this.transactionRepository.findOne({
        where: {
          produce_id: event.produce_id,
          status: In([TransactionStatus.IN_PROGRESS, TransactionStatus.PENDING])
        },
        order: { created_at: 'DESC' }
      });

      // Emit response event
      this.eventEmitter.emit('produce.transaction.latest.response', {
        produce_id: event.produce_id,
        transaction: transaction
      });
    } catch (error) {
      this.logger.error(`Failed to get latest transaction for produce ${event.produce_id}`, error);
      throw error;
    }
  }
}
