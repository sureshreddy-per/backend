import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../enums/notification-type.enum';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('notification.create')
  async handleNotificationCreate(payload: {
    user_id: string;
    type: NotificationType;
    data: Record<string, any>;
  }) {
    try {
      await this.notificationService.create(payload);
    } catch (error) {
      this.logger.error(
        `Failed to create notification for user ${payload.user_id}: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('notification.inspectors')
  async handleInspectorNotification(payload: {
    type: NotificationType;
    data: Record<string, any>;
  }) {
    try {
      await this.notificationService.notifyInspectors(payload);
    } catch (error) {
      this.logger.error(
        `Failed to notify inspectors: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('notification.push')
  async handlePushNotification(payload: {
    user_id: string;
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    };
  }) {
    try {
      await this.notificationService['sendPushNotification'](
        payload.user_id,
        {
          notification: {
            title: payload.notification.title,
            body: payload.notification.body,
          },
          data: payload.notification.data,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${payload.user_id}: ${error.message}`,
        error.stack,
      );
    }
  }
} 