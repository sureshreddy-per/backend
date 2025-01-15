import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OnEvent } from "@nestjs/event-emitter";
import { Notification } from "../entities/notification.entity";
import { NotificationType } from "../enums/notification-type.enum";
import { UserRole } from "../../enums/user-role.enum";
import { UsersService } from "../../users/services/users.service";
import { UpdateNotificationPreferencesDto } from "../dto/update-notification-preferences.dto";
import { NotificationPreferences } from "../entities/notification-preferences.entity";
import * as admin from "firebase-admin";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreferences)
    private readonly notificationPreferencesRepository: Repository<NotificationPreferences>,
    private readonly usersService: UsersService,
  ) {}

  async create(data: {
    user_id: string;
    type: NotificationType;
    data: Record<string, any>;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user_id: data.user_id,
      type: data.type,
      data: data.data,
      is_read: false,
    });
    return await this.notificationRepository.save(notification);
  }

  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: { user_id: userId },
        order: { created_at: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
      });

    return { notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationRepository.update(notificationId, {
      is_read: true,
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );
  }

  async remove(id: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    await this.notificationRepository.remove(notification);
  }

  async updatePreferences(userId: string, data: UpdateNotificationPreferencesDto): Promise<NotificationPreferences> {
    this.logger.debug(`Updating preferences for user ${userId}`);
    
    const user = await this.usersService.findOne(userId);
    if (!user) {
      this.logger.error(`User with ID ${userId} not found`);
      throw new NotFoundException('User not found');
    }

    try {
      let preferences = await this.notificationPreferencesRepository.findOne({
        where: { user_id: userId },
      });

      if (!preferences) {
        this.logger.debug(`Creating new preferences for user ${userId}`);
        preferences = this.notificationPreferencesRepository.create({
          user_id: userId,
          email_enabled: data.email_enabled ?? true,
          sms_enabled: data.sms_enabled ?? true,
          push_enabled: data.push_enabled ?? true,
          notification_types: data.notification_types ?? Object.values(NotificationType),
        });
      } else {
        // Update existing preferences
        if (data.email_enabled !== undefined) {
          preferences.email_enabled = data.email_enabled;
        }
        if (data.sms_enabled !== undefined) {
          preferences.sms_enabled = data.sms_enabled;
        }
        if (data.push_enabled !== undefined) {
          preferences.push_enabled = data.push_enabled;
        }
        if (data.notification_types) {
          preferences.notification_types = data.notification_types;
        }
      }

      const savedPreferences = await this.notificationPreferencesRepository.save(preferences);
      this.logger.debug(`Successfully updated preferences for user ${userId}`);
      return savedPreferences;
    } catch (error) {
      this.logger.error(`Error updating preferences for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const preferences = await this.notificationPreferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      const defaultPreferences = this.notificationPreferencesRepository.create({
        user_id: userId,
        email_enabled: true,
        sms_enabled: true,
        push_enabled: true,
        notification_types: Object.values(NotificationType),
      });
      return this.notificationPreferencesRepository.save(defaultPreferences);
    }

    return preferences;
  }

  async updateFCMToken(userId: string, fcmToken: string): Promise<void> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.usersService.updateFCMToken(userId, fcmToken);
  }

  private async sendPushNotification(
    userId: string,
    payload: admin.messaging.MessagingPayload,
  ): Promise<void> {
    try {
      const preferences = await this.getPreferences(userId);
      if (!preferences.push_enabled) {
        return;
      }

      const fcmToken = await this.usersService.getFCMToken(userId);
      if (!fcmToken) {
        this.logger.warn(`No FCM token found for user ${userId}`);
        return;
      }

      await admin.messaging().sendToDevice(fcmToken, payload);
      this.logger.log(`Push notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${userId}`,
        error.stack,
      );
    }
  }

  async notifyInspectors(data: {
    type: NotificationType;
    data: Record<string, any>;
  }): Promise<void> {
    const inspectors = await this.usersService.findByRole(UserRole.INSPECTOR);
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
}
