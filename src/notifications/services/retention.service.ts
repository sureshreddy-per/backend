import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RetentionService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  @Cron('0 0 * * *') // Run daily at midnight
  async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.notificationRepository.delete({
      created_at: LessThan(thirtyDaysAgo),
      is_read: true,
    });
  }
} 