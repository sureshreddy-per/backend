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
    user_id: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user_id,
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
    notification.read_at = new Date();

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
    notification.sent_at = new Date();

    return this.notificationRepository.save(notification);
  }

  async findByUser(user_id: string, page = 1, limit = 10) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { user_id },
      order: { created_at: 'DESC' },
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

  async getUnreadCount(user_id: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        user_id,
        status: NotificationStatus.SENT,
        read_at: null,
      },
    });
  }

  @OnEvent('offer.created')
  async handleOfferCreated(payload: { offer_id: string; produce_id: string; buyer_id: string }) {
    const produce = await this.produceRepository.findOne({
      where: { id: payload.produce_id },
    });

    if (!produce) {
      throw new NotFoundException(`Produce with ID "${payload.produce_id}" not found`);
    }

    const farmer = await this.userRepository.findOne({
      where: { id: produce.farmer_id },
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID "${produce.farmer_id}" not found`);
    }

    await this.create(
      farmer.id,
      NotificationType.OFFER_CREATED,
      'New Offer Received',
      'You have received a new offer on your produce listing.',
      {
        offer_id: payload.offer_id,
        produce_id: payload.produce_id,
        buyer_id: payload.buyer_id,
      },
    );
  }

  @OnEvent('offer.updated')
  async handleOfferUpdated(payload: { offer_id: string; buyer_id: string; produce_id: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.buyer_id },
    });

    await this.create(
      user.id,
      NotificationType.OFFER_UPDATED,
      'Offer Updated',
      'Your offer has been updated.',
      {
        offer_id: payload.offer_id,
        produce_id: payload.produce_id,
      },
    );
  }

  @OnEvent('offer.accepted')
  async handleOfferAccepted(payload: { offer_id: string; buyer_id: string; produce_id: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.buyer_id },
    });

    await this.create(
      user.id,
      NotificationType.OFFER_ACCEPTED,
      'Offer Accepted',
      'Your offer has been accepted!',
      {
        offer_id: payload.offer_id,
        produce_id: payload.produce_id,
      },
    );
  }

  @OnEvent('offer.rejected')
  async handleOfferRejected(payload: { offer_id: string; buyer_id: string; produce_id: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.buyer_id },
    });

    await this.create(
      user.id,
      NotificationType.OFFER_REJECTED,
      'Offer Rejected',
      'Your offer has been rejected.',
      {
        offer_id: payload.offer_id,
        produce_id: payload.produce_id,
      },
    );
  }

  @OnEvent('rating.created')
  async handleRatingCreated(payload: { rating_id: string; rated_user_id: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.rated_user_id },
    });

    await this.create(
      user.id,
      NotificationType.RATING_RECEIVED,
      'New Rating Received',
      'You have received a new rating.',
      {
        rating_id: payload.rating_id,
      },
    );
  }

  @OnEvent('quality.updated')
  async handleQualityUpdated(payload: { produce_id: string; user_id: string; quality_id: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.user_id },
    });

    await this.create(
      user.id,
      NotificationType.QUALITY_UPDATED,
      'Quality Grade Updated',
      'The quality grade for your produce has been updated.',
      {
        produce_id: payload.produce_id,
        quality_id: payload.quality_id,
      },
    );
  }

  @OnEvent('price.updated')
  async handlePriceUpdated(payload: { produce_id: string; user_id: string; price: number }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.user_id },
    });

    await this.create(
      user.id,
      NotificationType.PRICE_UPDATED,
      'Price Updated',
      'The price for your produce has been updated.',
      {
        produce_id: payload.produce_id,
        price: payload.price,
      },
    );
  }

  async findAll(page = 1, limit = 10) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      order: { created_at: 'DESC' },
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