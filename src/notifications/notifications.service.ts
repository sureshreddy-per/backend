import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
    });
    return this.notificationRepository.save(notification);
  }

  async findAll(page = 1, limit = 10) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async findByUser(userId: string, userType: 'customer' | 'buyer', page = 1, limit = 10) {
    const where = userType === 'customer'
      ? { customerId: userId }
      : { buyerId: userId };

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string, userType: 'customer' | 'buyer'): Promise<void> {
    const where = userType === 'customer'
      ? { customerId: userId }
      : { buyerId: userId };

    await this.notificationRepository.update(
      { ...where, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string, userType: 'customer' | 'buyer'): Promise<number> {
    const where = userType === 'customer'
      ? { customerId: userId }
      : { buyerId: userId };

    return this.notificationRepository.count({
      where: { ...where, isRead: false },
    });
  }
} 