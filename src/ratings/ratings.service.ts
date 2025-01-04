import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Offer } from '../offers/entities/offer.entity';
import { OfferStatus } from '../offers/enums/offer-status.enum';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>
  ) {}

  async create(createRatingDto: CreateRatingDto) {
    const offer = await this.offerRepository.findOne({
      where: { id: createRatingDto.offerId },
      relations: ['buyer', 'produce', 'produce.farmer']
    });

    if (!offer || offer.status !== OfferStatus.COMPLETED) {
      throw new Error('Cannot rate an incomplete transaction');
    }

    const rating = new Rating();
    Object.assign(rating, {
      ...createRatingDto,
      createdAt: new Date(),
      updatedAt: new Date()
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