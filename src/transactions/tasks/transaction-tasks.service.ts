import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TransactionService } from '../services/transaction.service';
import { RatingsService } from '../../ratings/ratings.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { TransactionStatus } from '../entities/transaction.entity';

@Injectable()
export class TransactionTasks {
  private readonly logger = new Logger(TransactionTasks.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly ratingsService: RatingsService,
    private readonly notificationService: NotificationService
  ) {}

  @Cron('*/15 * * * *') // Every 15 minutes
  async handleDeliveryWindows() {
    this.logger.log('Checking delivery windows...');
    try {
      await this.transactionService.checkDeliveryWindows();
    } catch (error) {
      this.logger.error(`Error checking delivery windows: ${error.message}`);
    }
  }

  @Cron('0 */1 * * *') // Every hour
  async handleRatingReminders() {
    this.logger.log('Sending rating reminders...');
    try {
      const response = await this.transactionService.findAll({
        where: {
          requires_rating: true,
          rating_completed: false
        }
      });

      for (const transaction of response.items) {
        // Send reminder to both parties if they haven't rated yet
        const ratings = await this.ratingsService.findByTransaction(transaction.id);
        const buyerRated = ratings.some(r => r.rating_user_id === transaction.buyer_id);
        const farmerRated = ratings.some(r => r.rating_user_id === transaction.farmer_id);

        if (!buyerRated) {
          await this.notificationService.create({
            user_id: transaction.buyer_id,
            type: NotificationType.RATING_REQUIRED,
            data: {
              transaction_id: transaction.id,
              reminder: true
            }
          });
        }

        if (!farmerRated) {
          await this.notificationService.create({
            user_id: transaction.farmer_id,
            type: NotificationType.RATING_REQUIRED,
            data: {
              transaction_id: transaction.id,
              reminder: true
            }
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error sending rating reminders: ${error.message}`);
    }
  }

  @Cron('0 0 * * *') // Every day at midnight
  async handleExpiredTransactions() {
    this.logger.log('Cleaning up expired transactions...');
    try {
      const response = await this.transactionService.findAll({
        where: {
          status: TransactionStatus.EXPIRED,
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
        }
      });

      for (const transaction of response.items) {
        await this.notificationService.create({
          user_id: transaction.farmer_id,
          type: NotificationType.TRANSACTION_CANCELLED,
          data: {
            transaction_id: transaction.id,
            reason: 'Transaction expired and was not reactivated within 7 days'
          }
        });

        await this.notificationService.create({
          user_id: transaction.buyer_id,
          type: NotificationType.TRANSACTION_CANCELLED,
          data: {
            transaction_id: transaction.id,
            reason: 'Transaction expired and was not reactivated within 7 days'
          }
        });

        await this.transactionService.cancel(
          transaction.id,
          'Transaction expired and was not reactivated within 7 days'
        );
      }
    } catch (error) {
      this.logger.error(`Error handling expired transactions: ${error.message}`);
    }
  }
} 