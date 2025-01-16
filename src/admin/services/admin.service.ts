import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import {
  AdminAuditLog,
  AdminActionType,
} from "../entities/admin-audit-log.entity";
import { SystemConfig } from "../../config/entities/system-config.entity";
import { UsersService } from "../../users/services/users.service";
import { ProduceService } from "../../produce/services/produce.service";
import { OffersService } from "../../offers/services/offers.service";
import { TransactionService } from "../../transactions/services/transaction.service";
import { UserStatus } from "../../users/entities/user.entity";
import { UserRole } from "../../enums/user-role.enum";
import { ProduceStatus } from "../../produce/enums/produce-status.enum";
import { OfferStatus } from "../../offers/enums/offer-status.enum";
import { Transaction, TransactionStatus } from "../../transactions/entities/transaction.entity";
import { UpdateSystemConfigDto } from "../dto/update-system-config.dto";
import { AuditLogFilterDto } from "../dto/audit-log-filter.dto";
import { InspectionPriority } from "../dto/assign-inspector.dto";
import { SystemConfigKey } from "../../config/enums/system-config-key.enum";

const CACHE_TTL = parseInt(process.env.ADMIN_CACHE_TTL || '3600'); // 1 hour
const CACHE_PREFIX = 'admin:';
const BATCH_SIZE = parseInt(process.env.ADMIN_BATCH_SIZE || '50');

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly adminAuditLogRepository: Repository<AdminAuditLog>,
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepository: Repository<SystemConfig>,
    private readonly usersService: UsersService,
    private readonly produceService: ProduceService,
    private readonly offersService: OffersService,
    private readonly transactionService: TransactionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getCacheKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  private async clearSystemConfigCache(): Promise<void> {
    await this.cacheManager.del(this.getCacheKey('system-config'));
  }

  private async logAction(
    admin_id: string,
    action: AdminActionType,
    entity_id: string,
    details: any,
    ip_address?: string,
  ): Promise<AdminAuditLog> {
    try {
      const log = this.adminAuditLogRepository.create({
        admin_id,
        action,
        entity_id,
        details,
        ip_address,
      });
      return await this.adminAuditLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Error logging admin action: ${error.message}`);
      throw error;
    }
  }

  async blockUser(
    admin_id: string,
    user_id: string,
    reason: string,
    duration_days: number,
    ip_address?: string,
  ) {
    const user = await this.usersService.findOne(user_id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.usersService.blockUser(user_id, reason);
    await this.logAction(
      admin_id,
      AdminActionType.BLOCK_USER,
      user_id,
      { reason, duration_days },
      ip_address,
    );
  }

  async unblockUser(
    admin_id: string,
    user_id: string,
    reason: string,
    ip_address?: string,
  ) {
    const user = await this.usersService.findOne(user_id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.usersService.unblockUser(user_id);
    await this.logAction(
      admin_id,
      AdminActionType.UNBLOCK_USER,
      user_id,
      { reason },
      ip_address,
    );
  }

  async deleteProduce(
    admin_id: string,
    produce_id: string,
    reason: string,
    ip_address?: string,
  ) {
    const produce = await this.produceService.findOne(produce_id);
    if (!produce) {
      throw new NotFoundException("Produce not found");
    }

    await this.produceService.updateStatus(produce_id, ProduceStatus.CANCELLED);
    await this.logAction(
      admin_id,
      AdminActionType.DELETE_PRODUCE,
      produce_id,
      { reason },
      ip_address,
    );
  }

  async cancelOffer(
    admin_id: string,
    offer_id: string,
    reason: string,
    ip_address?: string,
  ) {
    const offer = await this.offersService.findOne(offer_id);
    if (!offer) {
      throw new NotFoundException("Offer not found");
    }

    await this.offersService.updateStatus(offer_id, OfferStatus.CANCELLED);
    await this.logAction(
      admin_id,
      AdminActionType.CANCEL_OFFER,
      offer_id,
      { reason },
      ip_address,
    );
  }

  async cancelTransaction(
    admin_id: string,
    transaction_id: string,
    reason: string,
    ip_address?: string,
  ) {
    const transaction = await this.transactionService.findOne(transaction_id);
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    await this.transactionService.cancel(transaction_id, reason);
    await this.logAction(
      admin_id,
      AdminActionType.CANCEL_TRANSACTION,
      transaction_id,
      { reason },
      ip_address,
    );
  }

  async assignInspector(
    admin_id: string,
    produce_id: string,
    inspector_id: string,
    priority: InspectionPriority,
    notes: string,
    ip_address?: string,
  ) {
    const produce = await this.produceService.findOne(produce_id);
    if (!produce) {
      throw new NotFoundException("Produce not found");
    }

    const inspector = await this.usersService.findOne(inspector_id);
    if (!inspector || inspector.role !== UserRole.INSPECTOR) {
      throw new BadRequestException("Invalid inspector");
    }

    await this.produceService.assignInspector(produce_id, inspector_id);
    await this.logAction(
      admin_id,
      AdminActionType.ASSIGN_INSPECTOR,
      produce_id,
      { inspector_id, priority, notes },
      ip_address,
    );
  }

  async updateSystemConfig(
    admin_id: string,
    config: UpdateSystemConfigDto,
    ip_address?: string,
  ) {
    const entries = Object.entries(config);
    for (const [key, value] of entries) {
      const configKey = key as SystemConfigKey;
      const existingConfig = await this.systemConfigRepository.findOne({
        where: { key: configKey, is_active: true },
      });

      if (existingConfig) {
        existingConfig.value = value.toString();
        existingConfig.updated_by = admin_id;
        await this.systemConfigRepository.save(existingConfig);
      } else {
        const newConfig = new SystemConfig();
        newConfig.key = configKey;
        newConfig.value = value.toString();
        newConfig.description = `Config for ${key}`;
        newConfig.updated_by = admin_id;
        await this.systemConfigRepository.save(newConfig);
      }
    }

    await this.logAction(
      admin_id,
      AdminActionType.UPDATE_SYSTEM_CONFIG,
      admin_id,
      config,
      ip_address,
    );

    await this.clearSystemConfigCache();
  }

  async getSystemConfig() {
    const cacheKey = this.getCacheKey('system-config');
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const configs = await this.systemConfigRepository.find({
      where: { is_active: true },
    });

    const result = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {});

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getAuditLogs(filterDto: AuditLogFilterDto) {
    const cacheKey = this.getCacheKey(`audit-logs:${JSON.stringify(filterDto)}`);
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const query = this.adminAuditLogRepository.createQueryBuilder("log");

    if (filterDto.start_date) {
      query.andWhere("log.created_at >= :start_date", {
        start_date: filterDto.start_date,
      });
    }

    if (filterDto.end_date) {
      query.andWhere("log.created_at <= :end_date", {
        end_date: filterDto.end_date,
      });
    }

    if (filterDto.action) {
      query.andWhere("log.action = :action", { action: filterDto.action });
    }

    if (filterDto.admin_id) {
      query.andWhere("log.admin_id = :admin_id", {
        admin_id: filterDto.admin_id,
      });
    }

    if (filterDto.entity_id) {
      query.andWhere("log.entity_id = :entity_id", {
        entity_id: filterDto.entity_id,
      });
    }

    query.orderBy("log.created_at", "DESC");

    const [items, total] = await query.getManyAndCount();
    const result = { items, total };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getSystemMetrics() {
    const cacheKey = this.getCacheKey('system-metrics');
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const [
      totalUsers,
      activeUsers,
      totalProduce,
      availableProduce,
      totalTransactions,
      completedTransactions,
    ] = await Promise.all([
      this.usersService.count(),
      this.usersService.countByStatus(UserStatus.ACTIVE),
      this.produceService.count(),
      this.produceService.countByStatus(ProduceStatus.AVAILABLE),
      this.transactionService.count(),
      this.transactionService.countByStatus(TransactionStatus.COMPLETED),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        utilization_rate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      },
      produce: {
        total: totalProduce,
        available: availableProduce,
        utilization_rate: totalProduce > 0 ? (availableProduce / totalProduce) * 100 : 0,
      },
      transactions: {
        total: totalTransactions,
        completed: completedTransactions,
        completion_rate: totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0,
      },
    };
  }

  async getUserStats() {
    const cacheKey = this.getCacheKey('user-stats');
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const stats = await this.usersService.getStats();
    await this.cacheManager.set(cacheKey, stats, CACHE_TTL);
    return stats;
  }

  async getTransactionStats() {
    const cacheKey = this.getCacheKey('transaction-stats');
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const stats = await this.transactionService.getStats();
    await this.cacheManager.set(cacheKey, stats, CACHE_TTL);
    return stats;
  }

  async getRevenueStats() {
    const cacheKey = this.getCacheKey('revenue-stats');
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const stats = await this.transactionService.getRevenueStats();
    await this.cacheManager.set(cacheKey, stats, CACHE_TTL);
    return stats;
  }

  async getProduceStats() {
    const cacheKey = this.getCacheKey('produce-stats');
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const stats = await this.produceService.getStats();
    await this.cacheManager.set(cacheKey, stats, CACHE_TTL);
    return stats;
  }
}
