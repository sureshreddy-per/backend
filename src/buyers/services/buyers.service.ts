import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buyer } from '../entities/buyer.entity';

@Injectable()
export class BuyersService {
  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
  ) {}

  async findByPriceRange(price: number): Promise<Buyer[]> {
    return this.buyerRepository.find();
  }

  async findNearby(lat: number, lon: number, radius: number = 100): Promise<Buyer[]> {
    return this.buyerRepository
      .createQueryBuilder('buyer')
      .where(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(split_part(buyer.location, '-', 1)::float)) *
            cos(radians(split_part(buyer.location, '-', 2)::float) - radians(:lon)) +
            sin(radians(:lat)) * sin(radians(split_part(buyer.location, '-', 1)::float))
          )
        ) <= :radius`,
        { lat, lon, radius }
      )
      .orderBy(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(split_part(buyer.location, '-', 1)::float)) *
            cos(radians(split_part(buyer.location, '-', 2)::float) - radians(:lon)) +
            sin(radians(:lat)) * sin(radians(split_part(buyer.location, '-', 1)::float))
          )
        )`,
        'ASC'
      )
      .getMany();
  }
} 