import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buyer } from './entities/buyer.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class BuyersService {
  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<Buyer> {
    const buyer = await this.buyerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!buyer) {
      throw new NotFoundException(`Buyer with ID ${id} not found`);
    }

    return buyer;
  }

  async findByUser(userId: string): Promise<Buyer> {
    const buyer = await this.buyerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!buyer) {
      throw new NotFoundException(`Buyer with user ID ${userId} not found`);
    }

    return buyer;
  }

  async update(id: string, updateData: Partial<Buyer>): Promise<Buyer> {
    const buyer = await this.findOne(id);
    Object.assign(buyer, updateData);
    return this.buyerRepository.save(buyer);
  }

  async findAll(page = 1, limit = 10) {
    const [buyers, total] = await this.buyerRepository.findAndCount({
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      buyers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(userId: string, buyerData: Partial<Buyer>): Promise<Buyer> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const buyer = this.buyerRepository.create({
      ...buyerData,
      userId,
    });

    return this.buyerRepository.save(buyer);
  }

  async findNearby(lat: number, lng: number, radius: number = 50): Promise<Buyer[]> {
    const buyers = await this.buyerRepository
      .createQueryBuilder('buyer')
      .innerJoinAndSelect('buyer.user', 'user')
      .where(
        'ST_DWithin(ST_SetSRID(ST_MakePoint(user.lng, user.lat), 4326)::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
        {
          lat,
          lng,
          radius: radius * 1000, // Convert km to meters
        },
      )
      .getMany();

    return buyers;
  }
} 