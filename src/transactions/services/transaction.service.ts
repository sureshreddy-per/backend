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
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { OfferAcceptedEvent } from '../../offers/events/offer-accepted.event';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TransactionExpiredEvent, GetLatestTransactionEvent } from '../../offers/services/offers.service';
import { BuyersService } from '../../buyers/services/buyers.service';
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
    this.logger.log(`[findAllAndTransform] Finding transactions with options: ${JSON.stringify(options)}`);
    this.logger.log(`[findAllAndTransform] User role: ${userRole}`);

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

    this.logger.log(`[findAllAndTransform] Found ${items.length} transactions out of ${total} total`);
    if (items.length > 0) {
      this.logger.log(`[findAllAndTransform] Sample transaction: ${JSON.stringify(items[0])}`);
    }

    const { take = 10, skip = 0 } = options;
    const page = Math.floor(skip / take) + 1;
    const totalPages = Math.ceil(total / take);

    const transformedItems = items.map(item => this.transformTransactionResponse(item, userRole));
    this.logger.log(`[findAllAndTransform] Transformed ${transformedItems.length} items`);
    if (transformedItems.length > 0) {
      this.logger.log(`[findAllAndTransform] Sample transformed item: ${JSON.stringify(transformedItems[0])}`);
    }

    return {
      items: transformedItems,
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
    try {
      this.logger.log(`[handleOfferAccepted] Starting to handle offer.accepted event for offer ${event.offer.id}`);
      const { offer, buyer, farmer } = event;
      
      this.logger.log(`[handleOfferAccepted] Creating transaction for offer ${offer.id}, buyer ${buyer.id}, farmer ${farmer.id}`);
      // Create transaction with produce relation
      const transaction = await this.transactionRepository.create({
        offer_id: offer.id,
        produce_id: offer.produce_id,
        buyer_id: buyer.id,
        farmer_id: farmer.id,
        final_price: offer.price_per_unit,
        final_quantity: offer.quantity,
        status: TransactionStatus.PENDING,
      });

      this.logger.log(`[handleOfferAccepted] Saving transaction to database`);
      const savedTransaction = await this.transactionRepository.save(transaction);
      this.logger.log(`[handleOfferAccepted] Transaction saved with ID: ${savedTransaction.id}`);

      // Load the transaction with produce relation
      this.logger.log(`[handleOfferAccepted] Loading transaction with produce relation`);
      const loadedTransaction = await this.transactionRepository.findOne({
        where: { id: savedTransaction.id },
        relations: ['produce']
      });

      if (!loadedTransaction) {
        this.logger.error(`[handleOfferAccepted] Failed to load transaction ${savedTransaction.id} with produce relation`);
        throw new Error(`Failed to load transaction ${savedTransaction.id} with produce relation`);
      }
      this.logger.log(`[handleOfferAccepted] Successfully loaded transaction with produce relation`);

      // Record creation in history
      this.logger.log(`[handleOfferAccepted] Recording transaction creation in history`);
      await this.transactionHistoryService.createHistoryEntry(
        loadedTransaction.id,
        TransactionEvent.CREATED,
        buyer.user_id,
        null,
        TransactionStatus.PENDING,
        {
          offer_id: offer.id,
          produce_id: offer.produce_id,
          final_price: offer.price_per_unit,
          final_quantity: offer.quantity
        }
      );
      this.logger.log(`[handleOfferAccepted] Transaction history recorded`);

      const notificationData = {
        transaction_id: loadedTransaction.id,
        offer_id: offer.id,
        produce_id: offer.produce_id,
        price_per_unit: offer.price_per_unit,
        quantity: offer.quantity,
        status: TransactionStatus.PENDING,
        created_at: new Date(),
        message: 'A new transaction has been created from your accepted offer'
      };

      // Notify both parties
      this.logger.log(`[handleOfferAccepted] Sending notifications to buyer ${buyer.user_id} and farmer ${farmer.user_id}`);
      await Promise.all([
        this.notifyUser(buyer.user_id, NotificationType.TRANSACTION_CREATED, notificationData),
        this.notifyUser(farmer.user_id, NotificationType.TRANSACTION_CREATED, notificationData)
      ]);
      this.logger.log(`[handleOfferAccepted] Notifications sent successfully`);

      this.logger.log(`[handleOfferAccepted] Successfully completed handling offer.accepted event`);
      return loadedTransaction;
    } catch (error) {
      this.logger.error(`[handleOfferAccepted] Failed to handle offer accepted event: ${error.message}`, error.stack);
      throw error;
    }
  }

  @OnEvent('transaction.expired')
  async handleTransactionExpired(event: TransactionExpiredEvent) {
    try {
      const transaction = await this.findOne(event.transaction_id);
      if (!transaction) {
        this.logger.warn(`Transaction ${event.transaction_id} not found for expiration`);
        return;
      }

      // Get buyer and farmer user IDs
      const buyer = await this.buyersService.findOne(transaction.buyer_id);
      const farmer = await this.farmersService.findOne(transaction.farmer_id);

      if (!buyer?.user_id || !farmer?.user_id) {
        this.logger.warn(`Could not find user IDs for transaction ${transaction.id}`);
        return;
      }

      const now = new Date();
      const oldStatus = transaction.status;
      transaction.status = TransactionStatus.CANCELLED;
      transaction.metadata = {
        ...transaction.metadata,
        cancellation_reason: 'Transaction expired',
        cancelled_at: now,
      };

      await this.transactionRepository.save(transaction);

      // Record status change in history
      await this.transactionHistoryService.createHistoryEntry(
        transaction.id,
        TransactionEvent.STATUS_CHANGED,
        'system', // System-initiated change
        oldStatus,
        TransactionStatus.CANCELLED,
        {
          reason: 'Transaction expired',
          cancelled_at: now
        }
      );

      const notificationData = {
        transaction_id: transaction.id,
        offer_id: transaction.offer_id,
        produce_id: transaction.produce_id,
        previous_status: oldStatus,
        status: TransactionStatus.CANCELLED,
        reason: 'Transaction expired and been automatically cancelled',
        message: 'Transaction has expired and been automatically cancelled',
        cancelled_at: now,
        updated_at: now
      };

      // Notify both parties
      await Promise.all([
        this.notifyUser(buyer.user_id, NotificationType.TRANSACTION_CANCELLED, notificationData),
        this.notifyUser(farmer.user_id, NotificationType.TRANSACTION_CANCELLED, notificationData)
      ]);
    } catch (error) {
      this.logger.error(`Failed to handle transaction expired event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('transaction.latest.request')
  async handleLatestTransactionRequest(event: GetLatestTransactionEvent) {
    try {
      const { user_id, role } = event;
      const query: any = {
        where: {},
        order: { created_at: 'DESC' },
        take: 1,
      };

      if (role === 'BUYER') {
        const buyer = await this.buyersService.findByUserId(user_id);
        if (!buyer) return;
        query.where.buyer_id = buyer.id;
      } else if (role === 'FARMER') {
        const farmer = await this.farmersService.findByUserId(user_id);
        if (!farmer) return;
        query.where.farmer_id = farmer.id;
      }

      const [transaction] = await this.transactionRepository.find(query);
      
      if (transaction) {
        this.eventEmitter.emit('transaction.latest.response', {
          user_id,
          transaction: this.transformTransactionResponse(transaction, role),
        });
      }
    } catch (error) {
      this.logger.error(`Failed to handle latest transaction request: ${error.message}`, error.stack);
    }
  }

  private async notifyUser(userId: string, type: NotificationType, data: Record<string, any>) {
    try {
      await this.eventEmitter.emit('notification.create', {
        user_id: userId,
        type,
        data: {
          ...data,
          created_at: data.created_at || new Date(),
          message: data.message || this.getDefaultMessage(type)
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit notification event for user ${userId}, type ${type}: ${error.message}`,
        error.stack
      );
      // Don't throw error as notifications are non-critical
    }
  }

  private getDefaultMessage(type: NotificationType): string {
    switch (type) {
      case NotificationType.TRANSACTION_CREATED:
        return 'A new transaction has been created';
      case NotificationType.TRANSACTION_CANCELLED:
        return 'Transaction has been cancelled';
      case NotificationType.TRANSACTION_COMPLETED:
        return 'Transaction has been completed';
      case NotificationType.TRANSACTION_UPDATE:
        return 'Transaction has been updated';
      default:
        return 'Transaction notification';
    }
  }

  async findUnratedTransactions(): Promise<Transaction[]> {
    const transactions = await this.transactionRepository
      .createQueryBuilder("transaction")
      .where("transaction.status = :status", { status: TransactionStatus.COMPLETED })
      .andWhere(
        "(transaction.metadata->>'buyer_rating' IS NULL OR transaction.metadata->>'farmer_rating' IS NULL)"
      )
      .andWhere("transaction.requires_rating = :requires_rating", { requires_rating: true })
      .andWhere("transaction.rating_completed = :rating_completed", { rating_completed: false })
      .orderBy("transaction.created_at", "DESC")
      .getMany();

    return transactions;
  }
}