import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuditLog, AdminActionType } from '../entities/admin-audit-log.entity';
import { SystemConfig } from '../entities/system-config.entity';
import { UsersService } from '../../users/users.service';
import { ProduceService } from '../../produce/produce.service';
import { OffersService } from '../../offers/services/offers.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { UserStatus, UserRole } from '../../users/entities/user.entity';
import { ProduceStatus } from '../../produce/entities/produce.entity';
import { OfferStatus } from '../../offers/entities/offer.entity';
import { TransactionStatus } from '../../transactions/entities/transaction.entity';
import { Produce } from '../../produce/entities/produce.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Offer } from '../../offers/entities/offer.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly adminAuditLogRepository: Repository<AdminAuditLog>,
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepository: Repository<SystemConfig>,
    private readonly usersService: UsersService,
    private readonly produceService: ProduceService,
    private readonly offersService: OffersService,
    private readonly transactionService: TransactionService,
  ) {}

  private async logAction(
    admin_id: string,
    action: AdminActionType,
    details: any,
    entity_id?: string,
    entity_type?: string,
    ip_address?: string
  ): Promise<AdminAuditLog> {
    const log = this.adminAuditLogRepository.create({
      admin_id,
      action,
      details,
      entity_id,
      entity_type,
      ip_address,
    });
    return this.adminAuditLogRepository.save(log);
  }

  async blockUser(
    admin_id: string,
    user_id: string,
    reason: string,
    ip_address?: string
  ): Promise<void> {
    const user = await this.usersService.findOne(user_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousState = { status: user.status };
    await this.usersService.updateStatus(user_id, UserStatus.BLOCKED);

    await this.logAction(
      admin_id,
      AdminActionType.USER_BLOCK,
      {
        previous_state: previousState,
        new_state: { status: UserStatus.BLOCKED },
        reason,
      },
      user_id,
      'user',
      ip_address
    );
  }

  async unblockUser(
    admin_id: string,
    user_id: string,
    reason: string,
    ip_address?: string
  ): Promise<void> {
    const user = await this.usersService.findOne(user_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousState = { status: user.status };
    await this.usersService.updateStatus(user_id, UserStatus.ACTIVE);

    await this.logAction(
      admin_id,
      AdminActionType.USER_UNBLOCK,
      {
        previous_state: previousState,
        new_state: { status: UserStatus.ACTIVE },
        reason,
      },
      user_id,
      'user',
      ip_address
    );
  }

  async deleteProduce(
    admin_id: string,
    produce_id: string,
    reason: string,
    ip_address?: string
  ): Promise<void> {
    const produce = await this.produceService.findOne(produce_id);
    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    await this.logAction(
      admin_id,
      AdminActionType.PRODUCE_DELETE,
      {
        previous_state: produce,
        reason,
      },
      produce_id,
      'produce',
      ip_address
    );

    await this.produceService.remove(produce_id);
  }

  async cancelOffer(
    admin_id: string,
    offer_id: string,
    reason: string,
    ip_address?: string
  ): Promise<void> {
    const offer = await this.offersService.findOne(offer_id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    await this.logAction(
      admin_id,
      AdminActionType.OFFER_CANCEL,
      {
        previous_state: offer,
        reason,
      },
      offer_id,
      'offer',
      ip_address
    );

    await this.offersService.cancel(offer_id, reason);
  }

  async cancelTransaction(
    admin_id: string,
    transaction_id: string,
    reason: string,
    ip_address?: string
  ): Promise<void> {
    const transaction = await this.transactionService.findOne(transaction_id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.logAction(
      admin_id,
      AdminActionType.TRANSACTION_CANCEL,
      {
        previous_state: transaction,
        reason,
      },
      transaction_id,
      'transaction',
      ip_address
    );

    await this.transactionService.cancel(transaction_id, reason);
  }

  async getAuditLogs(
    filters: {
      action?: AdminActionType;
      admin_id?: string;
      entity_type?: string;
      from_date?: Date;
      to_date?: Date;
    },
    page = 1,
    limit = 10
  ): Promise<{ items: AdminAuditLog[]; total: number }> {
    const query = this.adminAuditLogRepository.createQueryBuilder('log');

    if (filters.action) {
      query.andWhere('log.action = :action', { action: filters.action });
    }

    if (filters.admin_id) {
      query.andWhere('log.admin_id = :admin_id', { admin_id: filters.admin_id });
    }

    if (filters.entity_type) {
      query.andWhere('log.entity_type = :entity_type', { entity_type: filters.entity_type });
    }

    if (filters.from_date) {
      query.andWhere('log.created_at >= :from_date', { from_date: filters.from_date });
    }

    if (filters.to_date) {
      query.andWhere('log.created_at <= :to_date', { to_date: filters.to_date });
    }

    const [items, total] = await query
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async assignInspector(
    admin_id: string,
    produce_id: string,
    inspector_id: string,
    reason: string,
    ip_address?: string
  ): Promise<void> {
    const produce = await this.produceService.findOne(produce_id);
    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    const inspector = await this.usersService.findOne(inspector_id);
    if (!inspector) {
      throw new NotFoundException('Inspector not found');
    }

    if (inspector.role !== UserRole.INSPECTOR) {
      throw new BadRequestException('User is not an inspector');
    }

    await this.logAction(
      admin_id,
      AdminActionType.INSPECTION_ASSIGN,
      {
        previous_state: { assigned_inspector: produce.assigned_inspector },
        new_state: { assigned_inspector: inspector_id },
        reason,
      },
      produce_id,
      'produce',
      ip_address
    );

    await this.produceService.update(produce_id, { assigned_inspector: inspector_id });
  }

  async updateSystemConfig(
    admin_id: string,
    config: {
      min_produce_price?: number;
      max_produce_price?: number;
      max_offer_validity_days?: number;
      min_transaction_amount?: number;
      inspection_required_above?: number;
      auto_approve_below?: number;
    },
    reason: string,
    ip_address?: string
  ): Promise<void> {
    // Get current config
    const currentConfig = await this.getSystemConfig();

    await this.logAction(
      admin_id,
      AdminActionType.SYSTEM_CONFIG_UPDATE,
      {
        previous_state: currentConfig,
        new_state: config,
        reason,
      },
      null,
      'system_config',
      ip_address
    );

    // Update config in database or cache
    await this.saveSystemConfig(config);
  }

  async getSystemMetrics(): Promise<{
    users: {
      total: number;
      active: number;
      blocked: number;
      farmers: number;
      buyers: number;
    };
    produce: {
      total: number;
      active: number;
      pending_inspection: number;
      rejected: number;
    };
    transactions: {
      total: number;
      pending: number;
      completed: number;
      cancelled: number;
      total_value: number;
    };
    offers: {
      total: number;
      active: number;
      accepted: number;
      rejected: number;
      expired: number;
    };
    system: {
      error_rate: number;
      avg_response_time: number;
      active_sessions: number;
    };
  }> {
    const [
      userStats,
      produceStats,
      transactionStats,
      offerStats,
      systemStats
    ] = await Promise.all([
      this.getUserStats(),
      this.getProduceStats(),
      this.getTransactionStats(),
      this.getOfferStats(),
      this.getSystemStats()
    ]);

    return {
      users: userStats,
      produce: produceStats,
      transactions: transactionStats,
      offers: offerStats,
      system: systemStats
    };
  }

  private async getUserStats() {
    const [users, activeUsers, blockedUsers, farmers, buyers] = await Promise.all([
      this.usersService.findAll(),
      this.usersService.findAll(1, 10000),
      this.usersService.findAll(1, 10000),
      this.usersService.findAll(1, 10000),
      this.usersService.findAll(1, 10000)
    ]);

    return {
      total: users.total,
      active: activeUsers.items.filter(u => u.status === UserStatus.ACTIVE).length,
      blocked: blockedUsers.items.filter(u => u.status === UserStatus.BLOCKED).length,
      farmers: farmers.items.filter(u => u.role === UserRole.FARMER).length,
      buyers: buyers.items.filter(u => u.role === UserRole.BUYER).length
    };
  }

  private async getProduceStats() {
    const produces = await this.produceService.findAll();
    const items = ('items' in produces ? produces.items : produces) as Produce[];
    const total = ('total' in produces ? produces.total : items.length) as number;
    
    return {
      total,
      active: items.filter(p => p.status === ProduceStatus.AVAILABLE).length,
      pending_inspection: items.filter(p => p.status === ProduceStatus.PENDING_INSPECTION).length,
      rejected: items.filter(p => p.status === ProduceStatus.REJECTED).length
    };
  }

  private async getTransactionStats() {
    const transactions = await this.transactionService.findAll();
    const items = ('items' in transactions ? transactions.items : transactions) as Transaction[];
    const total = ('total' in transactions ? transactions.total : items.length) as number;
    const totalValue = await this.transactionService.calculateTotalValue();

    return {
      total,
      pending: items.filter(t => t.status === TransactionStatus.PENDING).length,
      completed: items.filter(t => t.status === TransactionStatus.COMPLETED).length,
      cancelled: items.filter(t => t.status === TransactionStatus.CANCELLED).length,
      total_value: totalValue
    };
  }

  private async getOfferStats() {
    const offers = await this.offersService.findAll();
    const items = ('items' in offers ? offers.items : offers) as Offer[];
    const total = ('total' in offers ? offers.total : items.length) as number;

    return {
      total,
      active: items.filter(o => o.status === OfferStatus.ACTIVE).length,
      accepted: items.filter(o => o.status === OfferStatus.ACCEPTED).length,
      rejected: items.filter(o => o.status === OfferStatus.REJECTED).length,
      expired: items.filter(o => o.status === OfferStatus.EXPIRED).length
    };
  }

  private async getSystemStats() {
    // Get error rate from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [totalRequests, errorRequests] = await Promise.all([
      this.getRequestCount(oneHourAgo),
      this.getErrorCount(oneHourAgo)
    ]);

    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    // Get average response time from the last hour
    const avgResponseTime = await this.getAverageResponseTime(oneHourAgo);

    // Get active sessions (users who made requests in the last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeSessions = await this.getActiveSessionCount(fifteenMinutesAgo);

    return {
      error_rate: errorRate,
      avg_response_time: avgResponseTime,
      active_sessions: activeSessions
    };
  }

  private async getRequestCount(since: Date): Promise<number> {
    // Implement request count from logs or metrics storage
    return 0;
  }

  private async getErrorCount(since: Date): Promise<number> {
    // Implement error count from logs or metrics storage
    return 0;
  }

  private async getAverageResponseTime(since: Date): Promise<number> {
    // Implement average response time calculation from metrics storage
    return 0;
  }

  private async getActiveSessionCount(since: Date): Promise<number> {
    // Get count of unique users who made requests since the given date
    return 0;
  }

  async getSystemConfig(): Promise<SystemConfig> {
    const config = await this.systemConfigRepository.findOne({
      order: { created_at: 'DESC' }
    });

    if (!config) {
      // Create default config if none exists
      const defaultConfig = this.systemConfigRepository.create({
        min_produce_price: 0,
        max_produce_price: 1000000,
        max_offer_validity_days: 7,
        min_transaction_amount: 0,
        inspection_required_above: 10000,
        auto_approve_below: 1000
      });
      return this.systemConfigRepository.save(defaultConfig);
    }

    return config;
  }

  private async saveSystemConfig(config: Partial<SystemConfig>): Promise<void> {
    const currentConfig = await this.getSystemConfig();
    await this.systemConfigRepository.update(currentConfig.id, config);
  }

  async getDashboardStats() {
    const userStats = await this.getUserStats();
    const produceStats = await this.getProduceStats();
    const transactionStats = await this.getTransactionStats();
    const offerStats = await this.getOfferStats();
    const systemStats = await this.getSystemStats();

    return {
      users: userStats,
      produce: produceStats,
      transactions: transactionStats,
      offers: offerStats,
      system: systemStats
    };
  }
} 