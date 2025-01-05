import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { OffersService } from '../offers/services/offers.service';
import { Offer, OfferStatus } from '../offers/entities/offer.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    private readonly offersService: OffersService,
  ) {}

  async create(createRatingDto: CreateRatingDto, ratedByUserId: string): Promise<Rating> {
    const offer = await this.offersService.findOne(createRatingDto.offerId);

    if (!offer || offer.status === OfferStatus.PENDING || 
        offer.status === OfferStatus.CANCELLED || 
        offer.status === OfferStatus.REJECTED ||
        offer.status === OfferStatus.EXPIRED) {
      throw new BadRequestException('Can only rate completed offers');
    }

    const existingRating = await this.ratingRepository.findOne({
      where: {
        offerId: createRatingDto.offerId,
        ratedByUserId,
      },
    });

    if (existingRating) {
      throw new BadRequestException('You have already rated this offer');
    }

    const rating = this.ratingRepository.create({
      ...createRatingDto,
      ratedByUserId,
      ratedUserId: offer.buyerId,
      offerId: offer.id,
    });

    return this.ratingRepository.save(rating);
  }

  async findAll() {
    return this.ratingRepository.find({
      relations: ['offer', 'offer.buyer', 'offer.produce', 'offer.produce.farmer']
    });
  }

  async findOne(id: string) {
    return this.ratingRepository.findOne({
      where: { id },
      relations: ['offer', 'offer.buyer', 'offer.produce', 'offer.produce.farmer']
    });
  }
} 