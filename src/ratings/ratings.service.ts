import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  async create(createRatingDto: CreateRatingDto & { user_id: string }): Promise<Rating> {
    const rating = this.ratingRepository.create(createRatingDto);
    return this.ratingRepository.save(rating);
  }

  async findAll(filters?: {
    rated_user_id?: string;
    rating_user_id?: string;
    transaction_id?: string;
  }): Promise<Rating[]> {
    const where: FindOptionsWhere<Rating> = {};
    
    if (filters) {
      if (filters.rated_user_id) where.rated_user_id = filters.rated_user_id;
      if (filters.rating_user_id) where.rating_user_id = filters.rating_user_id;
      if (filters.transaction_id) where.transaction_id = filters.transaction_id;
    }

    return this.ratingRepository.find({
      where,
      relations: ['rated_user', 'rating_user', 'transaction'],
      order: { created_at: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Rating> {
    const rating = await this.ratingRepository.findOne({
      where: { id },
      relations: ['rated_user', 'rating_user', 'transaction']
    });
    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }
    return rating;
  }

  async update(id: string, updateRatingDto: UpdateRatingDto): Promise<Rating> {
    const rating = await this.findOne(id);
    Object.assign(rating, updateRatingDto);
    return this.ratingRepository.save(rating);
  }

  async remove(id: string): Promise<void> {
    const rating = await this.findOne(id);
    await this.ratingRepository.remove(rating);
  }

  async findByRatedUser(userId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { rated_user_id: userId },
      relations: ['rated_user', 'rating_user', 'transaction'],
      order: { created_at: 'DESC' }
    });
  }

  async findByRatingUser(userId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { rating_user_id: userId },
      relations: ['rated_user', 'rating_user', 'transaction'],
      order: { created_at: 'DESC' }
    });
  }

  async findByTransaction(transactionId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { transaction_id: transactionId },
      relations: ['rated_user', 'rating_user', 'transaction'],
      order: { created_at: 'DESC' }
    });
  }

  async getAverageRating(userId: string): Promise<number> {
    const ratings = await this.findByRatedUser(userId);
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
    return sum / ratings.length;
  }
} 