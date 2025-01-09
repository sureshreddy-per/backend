import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { BaseService } from '../../common/base.service';
import { OnEvent } from '@nestjs/event-emitter';
import * as admin from 'firebase-admin';
import { UserRole } from '../../auth/enums/user-role.enum';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class NotificationService extends BaseService<Notification> {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly usersService: UsersService,
  ) {
    super(notificationRepository);
  }

  @OnEvent('offer.created')
  async handleNewOffer(payload: { 
    buyer_id: string, 
    farmer_id: string, 
    produce_id: string,
    price: number
  }) {
    await this.createNotification(
      payload.farmer_id,
      NotificationType.NEW_OFFER,
      {
        produce_id: payload.produce_id,
        buyer_id: payload.buyer_id,
        price: payload.price
      },
      'New offer received for your produce'
    );
  }

  @OnEvent('offer.status_changed')
  async handleOfferStatusChange(payload: {
    offer_id: string,
    old_status: string,
    new_status: string,
    buyer_id: string,
    farmer_id: string
  }) {
    const notifyUserId = payload.new_status === 'ACCEPTED' ? payload.buyer_id : payload.farmer_id;
    const message = payload.new_status === 'ACCEPTED' 
      ? 'Your offer has been accepted'
      : `Offer status changed to ${payload.new_status}`;

    await this.createNotification(
      notifyUserId,
      NotificationType.OFFER_STATUS_CHANGE,
      {
        offer_id: payload.offer_id,
        old_status: payload.old_status,
        new_status: payload.new_status
      },
      message
    );
  }

  @OnEvent('inspection.completed')
  async handleInspectionCompleted(payload: {
    produce_id: string,
    farmer_id: string,
    grade: number,
    has_offers: boolean
  }) {
    await this.createNotification(
      payload.farmer_id,
      NotificationType.INSPECTION_COMPLETED,
      {
        produce_id: payload.produce_id,
        grade: payload.grade,
        has_offers: payload.has_offers
      },
      'Quality inspection completed for your produce'
    );
  }

  @OnEvent('transaction.updated')
  async handleTransactionUpdate(payload: {
    transaction_id: string,
    status: string,
    buyer_id: string,
    farmer_id: string
  }) {
    // Notify both buyer and farmer
    await Promise.all([
      this.createNotification(
        payload.buyer_id,
        NotificationType.TRANSACTION_UPDATE,
        {
          transaction_id: payload.transaction_id,
          status: payload.status
        },
        `Transaction status updated to ${payload.status}`
      ),
      this.createNotification(
        payload.farmer_id,
        NotificationType.TRANSACTION_UPDATE,
        {
          transaction_id: payload.transaction_id,
          status: payload.status
        },
        `Transaction status updated to ${payload.status}`
      )
    ]);
  }

  private async createNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, any>,
    message: string
  ): Promise<void> {
    try {
      // Create notification in database
      const notification = await this.notificationRepository.save({
        user_id: userId,
        type,
        data,
        is_read: false
      });

      // Send Firebase push notification
      await this.sendPushNotification(userId, {
        notification: {
          title: this.getNotificationTitle(type),
          body: message
        },
        data: {
          type,
          ...data
        }
      });

      this.logger.log(`Notification created for user ${userId} of type ${type}`);
    } catch (error) {
      this.logger.error(
        `Failed to create notification for user ${userId}`,
        error.stack
      );
    }
  }

  private getNotificationTitle(type: NotificationType): string {
    const titles = {
      [NotificationType.NEW_OFFER]: 'New Offer',
      [NotificationType.OFFER_STATUS_CHANGE]: 'Offer Update',
      [NotificationType.INSPECTION_COMPLETED]: 'Inspection Complete',
      [NotificationType.TRANSACTION_UPDATE]: 'Transaction Update',
      [NotificationType.QUALITY_UPDATE]: 'Quality Update'
    };
    return titles[type] || 'Notification';
  }

  private async sendPushNotification(
    userId: string,
    payload: admin.messaging.MessagingPayload
  ): Promise<void> {
    try {
      // Get user's FCM token from user service or cache
      const fcmToken = await this.getFCMToken(userId);
      if (!fcmToken) {
        this.logger.warn(`No FCM token found for user ${userId}`);
        return;
      }

      await admin.messaging().sendToDevice(fcmToken, payload);
      this.logger.log(`Push notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${userId}`,
        error.stack
      );
    }
  }

  private async getFCMToken(userId: string): Promise<string | null> {
    // TODO: Implement getting FCM token from user service or cache
    return null;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId },
      { 
        is_read: true,
        read_at: new Date()
      }
    );
  }

  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ notifications: Notification[]; total: number }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return { notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { 
        user_id: userId,
        is_read: false
      }
    });
  }

  async notifyInspectors(data: {
    type: NotificationType;
    data: Record<string, any>;
  }): Promise<void> {
    // Get all inspectors
    const inspectors = await this.usersService.findByRole(UserRole.INSPECTOR);

    // Create notifications for each inspector
    await Promise.all(
      inspectors.map((inspector) =>
        this.create({
          user_id: inspector.id,
          type: data.type,
          data: data.data,
        }),
      ),
    );
  }

  async findByUser(user_id: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user_id },
      order: { created_at: 'DESC' },
    });
  }

  async markAllAsRead(user_id: string): Promise<void> {
    await this.notificationRepository.update(
      { user_id, is_read: false },
      { is_read: true, read_at: new Date() },
    );
  }
} 