import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { TransactionService } from "../services/transaction.service";
import { RatingsService } from "../../ratings/services/ratings.service";
import { NotificationType } from "../../notifications/enums/notification-type.enum";
import { TransactionStatus } from "../entities/transaction.entity";

@Injectable()
export class TransactionTasksService {
  private readonly logger = new Logger(TransactionTasksService.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly ratingsService: RatingsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron('0 0 * * *') // Run daily at midnight
  async checkUnratedTransactions() {
    const transactions = await this.transactionService.findUnratedTransactions();

    for (const transaction of transactions) {
      const { buyer_id, farmer_id, id: transaction_id, metadata } = transaction;

      // Check if buyer hasn't rated yet
      if (!metadata?.buyer_rating) {
        await this.notifyUser(buyer_id, NotificationType.RATING_REQUIRED, {
          transaction_id,
          message: 'Please rate your transaction with the farmer',
          created_at: new Date(),
          target_user_id: farmer_id,
          days_since_transaction: this.getDaysSinceTransaction(transaction.created_at)
        });
      }

      // Check if farmer hasn't rated yet
      if (!metadata?.farmer_rating) {
        await this.notifyUser(farmer_id, NotificationType.RATING_REQUIRED, {
          transaction_id,
          message: 'Please rate your transaction with the buyer',
          created_at: new Date(),
          target_user_id: buyer_id,
          days_since_transaction: this.getDaysSinceTransaction(transaction.created_at)
        });
      }
    }
  }

  private getDaysSinceTransaction(transactionDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - transactionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async notifyUser(userId: string, type: NotificationType, data: any) {
    try {
      await this.eventEmitter.emit('notification.create', {
        user_id: userId,
        type,
        data
      });
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}: ${error.message}`, error.stack);
    }
  }
}
