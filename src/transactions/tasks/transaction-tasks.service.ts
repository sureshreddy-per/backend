import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { TransactionService } from "../services/transaction.service";
import { RatingsService } from "../../ratings/services/ratings.service";
import { NotificationService } from "../../notifications/services/notification.service";
import { NotificationType } from "../../notifications/enums/notification-type.enum";
import { TransactionStatus } from "../entities/transaction.entity";

@Injectable()
export class TransactionTasksService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly ratingsService: RatingsService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron("0 0 * * *") // Run daily at midnight
  async checkUnratedTransactions() {
    const response = await this.transactionService.findAll({
      where: {
        status: TransactionStatus.COMPLETED,
      },
    });

    for (const transaction of response.items) {
      // Check if buyer has rated
      const buyerRatings = await this.ratingsService.findGivenRatings(transaction.buyer_id);
      if (buyerRatings.length === 0) {
        await this.notificationService.create({
          user_id: transaction.buyer_id,
          type: NotificationType.RATING_REQUIRED,
          data: {
            transaction_id: transaction.id,
          },
        });
      }

      // Check if farmer has rated
      const farmerRatings = await this.ratingsService.findGivenRatings(transaction.farmer_id);
      if (farmerRatings.length === 0) {
        await this.notificationService.create({
          user_id: transaction.farmer_id,
          type: NotificationType.RATING_REQUIRED,
          data: {
            transaction_id: transaction.id,
          },
        });
      }
    }
  }
}
