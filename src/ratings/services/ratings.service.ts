import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Rating } from "../entities/rating.entity";
import { CreateRatingDto } from "../dto/create-rating.dto";
import { TransactionService } from "../../transactions/services/transaction.service";
import { NotificationService } from "../../notifications/services/notification.service";
import { NotificationType } from "../../notifications/enums/notification-type.enum";

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    private readonly transactionsService: TransactionService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    userId: string,
    createRatingDto: CreateRatingDto,
  ): Promise<Rating> {
    // Get transaction details
    const transaction = await this.transactionsService.findOne(
      createRatingDto.transaction_id,
    );
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    // Verify user is part of the transaction
    if (transaction.buyer_id !== userId && transaction.farmer_id !== userId) {
      throw new BadRequestException(
        "You can only rate transactions you are part of",
      );
    }

    // Determine who is rating whom
    const ratingUserId = userId;
    const ratedUserId =
      userId === transaction.buyer_id
        ? transaction.farmer_id
        : transaction.buyer_id;

    // Check if rating already exists
    const existingRating = await this.ratingRepository.findOne({
      where: {
        transaction_id: createRatingDto.transaction_id,
        rating_user_id: ratingUserId,
      },
    });

    if (existingRating) {
      throw new BadRequestException("You have already rated this transaction");
    }

    // Create rating
    const rating = this.ratingRepository.create({
      transaction_id: createRatingDto.transaction_id,
      rating_user_id: ratingUserId,
      rated_user_id: ratedUserId,
      rating: createRatingDto.rating,
      comment: createRatingDto.comment,
      aspects: createRatingDto.aspects,
    });

    const savedRating = await this.ratingRepository.save(rating);

    // Notify rated user
    await this.notificationService.create({
      user_id: ratedUserId,
      type: NotificationType.RATING_RECEIVED,
      data: {
        transaction_id: createRatingDto.transaction_id,
        rating: createRatingDto.rating,
        from_user_id: ratingUserId,
      },
    });

    return savedRating;
  }

  async findByUser(userId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { rated_user_id: userId },
      order: { created_at: "DESC" },
      relations: ["rating_user", "transaction"],
    });
  }

  async getUserAverageRating(userId: string): Promise<{
    overall: number;
    aspects: {
      quality_accuracy: number;
      communication: number;
      reliability: number;
      timeliness: number;
    };
    total_ratings: number;
  }> {
    const ratings = await this.ratingRepository.find({
      where: { rated_user_id: userId },
    });

    if (ratings.length === 0) {
      return {
        overall: 0,
        aspects: {
          quality_accuracy: 0,
          communication: 0,
          reliability: 0,
          timeliness: 0,
        },
        total_ratings: 0,
      };
    }

    const overall =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    // Calculate aspect averages
    const aspects = {
      quality_accuracy: 0,
      communication: 0,
      reliability: 0,
      timeliness: 0,
    };

    const aspectCounts = {
      quality_accuracy: 0,
      communication: 0,
      reliability: 0,
      timeliness: 0,
    };

    ratings.forEach((rating) => {
      if (rating.aspects) {
        Object.keys(aspects).forEach((aspect) => {
          if (rating.aspects[aspect]) {
            aspects[aspect] += rating.aspects[aspect];
            aspectCounts[aspect]++;
          }
        });
      }
    });

    // Calculate averages for aspects
    Object.keys(aspects).forEach((aspect) => {
      if (aspectCounts[aspect] > 0) {
        aspects[aspect] = aspects[aspect] / aspectCounts[aspect];
      }
    });

    return {
      overall,
      aspects,
      total_ratings: ratings.length,
    };
  }
}
