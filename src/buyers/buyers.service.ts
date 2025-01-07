import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buyer } from './entities/buyer.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class BuyersService {
  constructor(
    @InjectRepository(Buyer)
    private buyersRepository: Repository<Buyer>,
    private usersService: UsersService,
  ) {}

  async createBuyer(userId: string, createBuyerDto: Partial<Buyer>): Promise<Buyer> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingBuyer = await this.buyersRepository.findOne({
      where: { user_id: userId },
    });
    if (existingBuyer) {
      throw new ConflictException('Buyer profile already exists');
    }

    const buyer = this.buyersRepository.create({
      ...createBuyerDto,
      user_id: userId,
    });
    return this.buyersRepository.save(buyer);
  }

  async findAll(): Promise<Buyer[]> {
    return this.buyersRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Buyer> {
    const buyer = await this.buyersRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }
    return buyer;
  }

  async findByUserId(userId: string): Promise<Buyer> {
    const buyer = await this.buyersRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }
    return buyer;
  }

  async update(id: string, updateBuyerDto: Partial<Buyer>): Promise<Buyer> {
    const buyer = await this.findOne(id);
    await this.buyersRepository.update(id, updateBuyerDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const buyer = await this.findOne(id);
    await this.buyersRepository.remove(buyer);
  }

  async findNearbyBuyers(lat: number, lng: number, radiusKm: number = 50): Promise<Buyer[]> {
    // Convert radius from kilometers to degrees (approximate)
    const radiusDegrees = radiusKm / 111.12; // 1 degree ≈ 111.12 kilometers at the equator

    // Use Haversine formula in raw SQL
    const buyers = await this.buyersRepository
      .createQueryBuilder('buyer')
      .select('buyer.*')
      .addSelect(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(buyer.latitude)) *
            cos(radians(buyer.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(buyer.latitude))
          )
        )`,
        'distance'
      )
      .where(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(buyer.latitude)) *
            cos(radians(buyer.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(buyer.latitude))
          )
        ) <= :radius`,
        { lat, lng, radius: radiusKm }
      )
      .orderBy('distance', 'ASC')
      .leftJoinAndSelect('buyer.user', 'user')
      .getRawAndEntities();

    return buyers.entities;
  }

  async validateBuyer(id: string): Promise<boolean> {
    const buyer = await this.buyersRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    return !!buyer && buyer.user.status === 'ACTIVE';
  }

  async findByPriceRange(price: number): Promise<Buyer[]> {
    // For now, return all buyers since we don't have price range fields yet
    return this.buyersRepository.find({
      relations: ['user'],
    });
  }
} 