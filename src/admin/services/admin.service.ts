import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuditLog, AdminActionType } from '../entities/admin-audit-log.entity';
import { SystemConfig } from '../entities/system-config.entity';
import { UsersService } from '../../users/services/users.service';
import { ProduceService } from '../../produce/services/produce.service';
import { OffersService } from '../../offers/services/offers.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { UserStatus } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { ProduceStatus } from '../../produce/enums/produce-status.enum';
import { OfferStatus } from '../../offers/entities/offer.entity';
import { TransactionStatus } from '../../transactions/entities/transaction.entity';
import { UpdateSystemConfigDto } from '../dto/update-system-config.dto';
import { AuditLogFilterDto } from '../dto/audit-log-filter.dto';
import { InspectionPriority } from '../dto/assign-inspector.dto';

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
    entity_id: string,
    details: any,
    ip_address?: string
  ): Promise<AdminAuditLog> {
    const log = this.adminAuditLogRepository.create({
      admin_id,
      action,
      entity_id,
      details,
      ip_address,
    });
    return await this.adminAuditLogRepository.save(log);
  }

  async blockUser(
    admin_id: string,
    user_id: string,
    reason: string,
    duration_days: number,
    ip_address?: string
  ) {
    const user = await this.usersService.findOne(user_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersService.blockUser(user_id, reason);
    await this.logAction(
      admin_id,
      AdminActionType.BLOCK_USER,
      user_id,
      { reason, duration_days },
      ip_address
    );
  }

  async unblockUser(
    admin_id: string,
    user_id: string,
    reason: string,
    ip_address?: string
  ) {
    const user = await this.usersService.findOne(user_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersService.unblockUser(user_id);
    await this.logAction(
      admin_id,
      AdminActionType.UNBLOCK_USER,
      user_id,
      { reason },
      ip_address
    );
  }

  async deleteProduce(
    admin_id: string,
    produce_id: string,
    reason: string,
    ip_address?: string
  ) {
    const produce = await this.produceService.findOne(produce_id);
    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    await this.produceService.updateStatus(produce_id, ProduceStatus.CANCELLED);
    await this.logAction(
      admin_id,
      AdminActionType.DELETE_PRODUCE,
      produce_id,
      { reason },
      ip_address
    );
  }

  async cancelOffer(
    admin_id: string,
    offer_id: string,
    reason: string,
    ip_address?: string
  ) {
    const offer = await this.offersService.findOne(offer_id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    await this.offersService.updateStatus(offer_id, OfferStatus.CANCELLED);
    await this.logAction(
      admin_id,
      AdminActionType.CANCEL_OFFER,
      offer_id,
      { reason },
      ip_address
    );
  }

  async cancelTransaction(
    admin_id: string,
    transaction_id: string,
    reason: string,
    ip_address?: string
  ) {
    const transaction = await this.transactionService.findOne(transaction_id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.transactionService.cancel(transaction_id, reason);
    await this.logAction(
      admin_id,
      AdminActionType.CANCEL_TRANSACTION,
      transaction_id,
      { reason },
      ip_address
    );
  }

  async assignInspector(
    admin_id: string,
    produce_id: string,
    inspector_id: string,
    priority: InspectionPriority,
    notes: string,
    ip_address?: string
  ) {
    const produce = await this.produceService.findOne(produce_id);
    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    const inspector = await this.usersService.findOne(inspector_id);
    if (!inspector || inspector.role !== UserRole.INSPECTOR) {
      throw new BadRequestException('Invalid inspector');
    }

    await this.produceService.assignInspector(produce_id, inspector_id);
    await this.logAction(
      admin_id,
      AdminActionType.ASSIGN_INSPECTOR,
      produce_id,
      { inspector_id, priority, notes },
      ip_address
    );
  }

  async updateSystemConfig(
    admin_id: string,
    config: UpdateSystemConfigDto,
    ip_address?: string
  ) {
    const entries = Object.entries(config);
    for (const [key, value] of entries) {
      const existingConfig = await this.systemConfigRepository.findOne({
        where: { key, is_active: true },
      });

      if (existingConfig) {
        existingConfig.value = value;
        existingConfig.updated_by = admin_id;
        await this.systemConfigRepository.save(existingConfig);
      } else {
        const newConfig = this.systemConfigRepository.create({
          key,
          value,
          created_by: admin_id,
          updated_by: admin_id,
        });
        await this.systemConfigRepository.save(newConfig);
      }
    }

    await this.logAction(
      admin_id,
      AdminActionType.UPDATE_SYSTEM_CONFIG,
      admin_id,
      config,
      ip_address
    );
  }

  async getSystemConfig() {
    const configs = await this.systemConfigRepository.find({
      where: { is_active: true },
    });
    return configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {});
  }

  async getAuditLogs(filterDto: AuditLogFilterDto) {
    const query = this.adminAuditLogRepository.createQueryBuilder('log');

    if (filterDto.start_date) {
      query.andWhere('log.created_at >= :start_date', {
        start_date: filterDto.start_date,
      });
    }

    if (filterDto.end_date) {
      query.andWhere('log.created_at <= :end_date', {
        end_date: filterDto.end_date,
      });
    }

    if (filterDto.action) {
      query.andWhere('log.action = :action', { action: filterDto.action });
    }

    if (filterDto.admin_id) {
      query.andWhere('log.admin_id = :admin_id', {
        admin_id: filterDto.admin_id,
      });
    }

    if (filterDto.entity_id) {
      query.andWhere('log.entity_id = :entity_id', {
        entity_id: filterDto.entity_id,
      });
    }

    query.orderBy('log.created_at', 'DESC');

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async getSystemMetrics() {
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      totalProduce,
      activeProduce,
      totalTransactions,
      completedTransactions,
    ] = await Promise.all([
      this.usersService.count(),
      this.usersService.countByStatus(UserStatus.ACTIVE),
      this.usersService.countByStatus(UserStatus.BLOCKED),
      this.produceService.count(),
      this.produceService.countByStatus(ProduceStatus.AVAILABLE),
      this.transactionService.count(),
      this.transactionService.countByStatus(TransactionStatus.COMPLETED),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
      },
      produce: {
        total: totalProduce,
        active: activeProduce,
      },
      transactions: {
        total: totalTransactions,
        completed: completedTransactions,
      },
    };
  }

  async getUserStats() {
    const stats = await this.usersService.getStats();
    return stats;
  }

  async getTransactionStats() {
    const stats = await this.transactionService.getStats();
    return stats;
  }

  async getRevenueStats() {
    const stats = await this.transactionService.getRevenueStats();
    return stats;
  }

  async getProduceStats() {
    const stats = await this.produceService.getStats();
    return stats;
  }
}