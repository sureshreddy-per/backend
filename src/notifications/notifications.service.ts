import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create(createNotificationDto as Partial<Notification>);
    return this.notificationRepository.save(notification);
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResponse<Notification>> {
    const [items, total] = await this.notificationRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' }
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string) {
    return this.notificationRepository.findOne({ where: { id } });
  }

  async findByUser(userId: string, page = 1, limit = 10): Promise<PaginatedResponse<Notification>> {
    const [items, total] = await this.notificationRepository.findAndCount({
      where: { user_id: userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' }
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async markAsRead(id: string) {
    const notification = await this.findOne(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    notification.is_read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true }
    );
  }

  async findUnreadByUser(userId: string) {
    return this.notificationRepository.find({
      where: { user_id: userId, is_read: false }
    });
  }
} 