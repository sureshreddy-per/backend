import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Rating } from './entities/rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { User } from '../auth/entities/user.entity';
import { Offer, OfferStatus } from '../offers/entities/offer.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createRatingDto: CreateRatingDto, ratedByUserId: string): Promise<Rating> {
    const offer = await this.offerRepository.findOne({
      where: { id: createRatingDto.offerId },
      relations: ['buyer', 'produce', 'produce.user'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status !== OfferStatus.ACCEPTED) {
      throw new BadRequestException('Can only rate completed transactions');
    }

    // Determine who is being rated based on who is rating
    const ratedUserId = offer.buyerId === ratedByUserId
      ? offer.produce.farmerId  // Buyer rating Farmer
      : offer.buyerId;       // Farmer rating Buyer

    // Check if rating already exists
    const existingRating = await this.ratingRepository.findOne({
      where: {
        offerId: offer.id,
        ratedByUserId,
      },
    });

    if (existingRating) {
      throw new BadRequestException('You have already rated this transaction');
    }

    const rating = this.ratingRepository.create({
      ...createRatingDto,
      ratedByUserId,
      ratedUserId,
      metadata: {
        categories: createRatingDto.categories,
        tags: createRatingDto.tags,
      },
    });

    const savedRating = await this.ratingRepository.save(rating);

    // Update user's average rating
    await this.updateUserRating(ratedUserId);

    // Emit rating created event
    this.eventEmitter.emit('rating.created', {
      ratingId: savedRating.id,
      offerId: savedRating.offerId,
      ratedByUserId: savedRating.ratedByUserId,
      ratedUserId: savedRating.ratedUserId,
      stars: savedRating.stars,
    });

    return savedRating;
  }

  async findOne(id: string): Promise<Rating> {
    const rating = await this.ratingRepository.findOne({
      where: { id },
      relations: ['ratedByUser', 'ratedUser', 'offer'],
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return rating;
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const [ratings, total] = await this.ratingRepository.findAndCount({
      where: { ratedUserId: userId },
      relations: ['ratedByUser', 'offer'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      ratings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByOffer(offerId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { offerId },
      relations: ['ratedByUser', 'ratedUser'],
    });
  }

  async getAverageRating(userId: string) {
    const result = await this.ratingRepository
      .createQueryBuilder('rating')
      .where('rating.ratedUserId = :userId', { userId })
      .select('AVG(rating.stars)', 'averageRating')
      .addSelect('COUNT(*)', 'totalRatings')
      .getRawOne();

    return {
      averageRating: Number(result.averageRating) || 0,
      totalRatings: Number(result.totalRatings) || 0,
    };
  }

  private async updateUserRating(userId: string) {
    const { averageRating, totalRatings } = await this.getAverageRating(userId);

    await this.userRepository.update(userId, {
      rating: averageRating,
      ratingCount: totalRatings,
    });
  }
} 