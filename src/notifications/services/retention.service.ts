import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  private readonly retentionDays: number;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly configService: ConfigService,
  ) {
    this.retentionDays = this.configService.get<number>('NOTIFICATION_RETENTION_DAYS', 30);
  }

  /**
   * Cleanup old notifications based on retention policy
   * Runs daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldNotifications() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    try {
      const result = await this.notificationRepository.delete({
        created_at: LessThan(cutoffDate),
        is_read: true, // Only delete read notifications
      });

      this.logger.log(`Cleaned up ${result.affected} old notifications`);
    } catch (error) {
      this.logger.error('Failed to cleanup old notifications:', error);
    }
  }

  /**
   * Get retention policy details
   */
  getRetentionPolicy() {
    return {
      retention_days: this.retentionDays,
      delete_conditions: {
        older_than: `${this.retentionDays} days`,
        must_be_read: true,
      },
    };
  }
} 