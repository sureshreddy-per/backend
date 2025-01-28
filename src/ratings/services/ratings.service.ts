import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Rating } from "../entities/rating.entity";
import { CreateRatingDto, RatingType } from "../dto/create-rating.dto";
import { TransactionService } from "../../transactions/services/transaction.service";
import { NotificationType } from "../../notifications/enums/notification-type.enum";
import { TransactionStatus } from "../../transactions/entities/transaction.entity";
import { User } from "../../users/entities/user.entity";
import { BuyersService } from "../../buyers/services/buyers.service";
import { FarmersService } from "../../farmers/farmers.service";
import { Logger } from "@nestjs/common";

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly transactionService: TransactionService,
    private readonly eventEmitter: EventEmitter2,
    private readonly buyersService: BuyersService,
    private readonly farmersService: FarmersService,
  ) {}

  private async updateUserRating(userId: string): Promise<void> {
    // Get all ratings received by the user
    const ratings = await this.ratingRepository.find({
      where: { rated_user_id: userId },
    });

    // Calculate average rating
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;

    // Update user's rating
    await this.userRepository.update(userId, {
      rating: Number(averageRating.toFixed(2)), // Round to 2 decimal places
    });
  }

  private async notifyUser(userId: string, type: NotificationType, data: Record<string, any>) {
    try {
      this.eventEmitter.emit('notification.create', {
        user_id: userId,
        type,
        data,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit notification event for user ${userId}, type ${type}: ${error.message}`,
        error.stack
      );
      // Don't throw error as notifications are non-critical
    }
  }

  async create(createRatingDto: CreateRatingDto, user: User): Promise<Rating> {
    const transaction = await this.transactionService.findOne(createRatingDto.transaction_id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException('Can only rate completed transactions');
    }

    // Determine who is rating whom based on rating type
    let rating_user_id = user.id;
    let rated_user_id: string;

    if (createRatingDto.rating_type === RatingType.BUYER_TO_FARMER) {
      const buyer = await this.buyersService.findByUserId(user.id);
      if (!buyer || buyer.id !== transaction.buyer_id) {
        throw new UnauthorizedException('Only the buyer can rate the farmer');
      }
      // Get the farmer's user ID
      const farmer = await this.farmersService.findOne(transaction.farmer_id);
      if (!farmer || !farmer.user_id) {
        throw new NotFoundException('Farmer not found');
      }
      rated_user_id = farmer.user_id;
    } else {
      const farmer = await this.farmersService.findByUserId(user.id);
      if (!farmer || farmer.id !== transaction.farmer_id) {
        throw new UnauthorizedException('Only the farmer can rate the buyer');
      }
      // Get the buyer's user ID
      const buyer = await this.buyersService.findOne(transaction.buyer_id);
      if (!buyer || !buyer.user_id) {
        throw new NotFoundException('Buyer not found');
      }
      rated_user_id = buyer.user_id;
    }

    // Check if rating already exists
    const existingRating = await this.ratingRepository.findOne({
      where: {
        transaction_id: transaction.id,
        rating_user_id: rating_user_id,
      },
    });

    if (existingRating) {
      throw new BadRequestException('Rating already exists for this transaction');
    }

    const rating = this.ratingRepository.create({
      transaction_id: transaction.id,
      rating_user_id: rating_user_id,
      rated_user_id: rated_user_id,
      rating: createRatingDto.rating,
      review: createRatingDto.review,
    });

    const savedRating = await this.ratingRepository.save(rating);

    // Update the rated user's average rating
    await this.updateUserRating(rated_user_id);

    // Send notification through event
    await this.notifyUser(rated_user_id, NotificationType.RATING_RECEIVED, {
      rating_id: savedRating.id,
      transaction_id: transaction.id,
      rating: rating.rating,
      from_user_id: rating_user_id,
      message: 'You have received a new rating',
      created_at: new Date(),
      review: rating.review || undefined,
      average_rating: await this.getUserAverageRating(rated_user_id)
    });

    return savedRating;
  }

  private async getUserAverageRating(userId: string): Promise<number> {
    const ratings = await this.ratingRepository.find({
      where: { rated_user_id: userId },
    });
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    return ratings.length > 0 ? Number((totalRating / ratings.length).toFixed(2)) : 0;
  }

  async findReceivedRatings(userId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { rated_user_id: userId },
      relations: ["rating_user", "rated_user", "transaction"],
      order: { created_at: "DESC" },
    });
  }

  async findGivenRatings(userId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { rating_user_id: userId },
      relations: ["rating_user", "rated_user", "transaction"],
      order: { created_at: "DESC" },
    });
  }

  async findOne(id: string): Promise<Rating> {
    const rating = await this.ratingRepository.findOne({
      where: { id },
      relations: ["rating_user", "rated_user", "transaction"],
    });

    if (!rating) {
      throw new NotFoundException("Rating not found");
    }

    return rating;
  }

  async findByTransaction(transactionId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { transaction_id: transactionId },
      relations: ["rating_user", "rated_user", "transaction"],
      order: { created_at: "DESC" },
    });
  }

  async delete(userId: string, id: string): Promise<void> {
    const rating = await this.findOne(id);

    if (!rating) {
      throw new NotFoundException("Rating not found");
    }

    if (rating.rating_user_id !== userId) {
      throw new UnauthorizedException("You can only delete your own ratings");
    }

    await this.ratingRepository.remove(rating);
  }
}

