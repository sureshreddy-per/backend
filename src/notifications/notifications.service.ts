import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';
import { User } from '../auth/entities/user.entity';
import { Produce } from '../produce/entities/produce.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      metadata,
      status: NotificationStatus.PENDING,
    });

    return this.notificationRepository.save(notification);
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async markAsSent(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }

    notification.status = NotificationStatus.SENT;
    notification.sentAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        userId,
        status: NotificationStatus.SENT,
        readAt: null,
      },
    });
  }

  @OnEvent('offer.created')
  async handleOfferCreated(payload: { offerId: string; produceId: string; buyerId: string }) {
    const produce = await this.produceRepository.findOne({
      where: { id: payload.produceId },
    });

    if (!produce) {
      throw new NotFoundException(`Produce with ID "${payload.produceId}" not found`);
    }

    const farmer = await this.userRepository.findOne({
      where: { id: produce.farmerId },
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID "${produce.farmerId}" not found`);
    }

    await this.create(
      farmer.id,
      NotificationType.OFFER_CREATED,
      'New Offer Received',
      'You have received a new offer on your produce listing.',
      {
        offerId: payload.offerId,
        produceId: payload.produceId,
        buyerId: payload.buyerId,
      },
    );
  }

  @OnEvent('offer.updated')
  async handleOfferUpdated(payload: { offerId: string; buyerId: string; produceId: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.buyerId },
    });

    await this.create(
      user.id,
      NotificationType.OFFER_UPDATED,
      'Offer Updated',
      'Your offer has been updated.',
      {
        offerId: payload.offerId,
        produceId: payload.produceId,
      },
    );
  }

  @OnEvent('offer.accepted')
  async handleOfferAccepted(payload: { offerId: string; buyerId: string; produceId: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.buyerId },
    });

    await this.create(
      user.id,
      NotificationType.OFFER_ACCEPTED,
      'Offer Accepted',
      'Your offer has been accepted!',
      {
        offerId: payload.offerId,
        produceId: payload.produceId,
      },
    );
  }

  @OnEvent('offer.rejected')
  async handleOfferRejected(payload: { offerId: string; buyerId: string; produceId: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.buyerId },
    });

    await this.create(
      user.id,
      NotificationType.OFFER_REJECTED,
      'Offer Rejected',
      'Your offer has been rejected.',
      {
        offerId: payload.offerId,
        produceId: payload.produceId,
      },
    );
  }

  @OnEvent('rating.created')
  async handleRatingCreated(payload: { ratingId: string; ratedUserId: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.ratedUserId },
    });

    await this.create(
      user.id,
      NotificationType.RATING_RECEIVED,
      'New Rating Received',
      'You have received a new rating.',
      {
        ratingId: payload.ratingId,
      },
    );
  }

  @OnEvent('quality.updated')
  async handleQualityUpdated(payload: { produceId: string; userId: string; qualityId: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    await this.create(
      user.id,
      NotificationType.QUALITY_UPDATED,
      'Quality Grade Updated',
      'The quality grade for your produce has been updated.',
      {
        produceId: payload.produceId,
        qualityId: payload.qualityId,
      },
    );
  }

  @OnEvent('price.updated')
  async handlePriceUpdated(payload: { produceId: string; userId: string; price: number }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    await this.create(
      user.id,
      NotificationType.PRICE_UPDATED,
      'Price Updated',
      'The price for your produce has been updated.',
      {
        produceId: payload.produceId,
        price: payload.price,
      },
    );
  }

  async findAll(page = 1, limit = 10) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
} 