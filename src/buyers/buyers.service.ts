import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buyer } from './entities/buyer.entity';
import { CreateBuyerDto } from './dto/create-buyer.dto';
import { UpdateBuyerDto } from './dto/update-buyer.dto';

@Injectable()
export class BuyersService {
  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
  ) {}

  async create(createBuyerDto: CreateBuyerDto): Promise<Buyer> {
    const buyer = this.buyerRepository.create(createBuyerDto);
    return this.buyerRepository.save(buyer);
  }

  async findAll(): Promise<Buyer[]> {
    return this.buyerRepository.find();
  }

  async findOne(id: string): Promise<Buyer> {
    const buyer = await this.buyerRepository.findOne({ where: { id } });
    if (!buyer) {
      throw new NotFoundException(`Buyer with ID ${id} not found`);
    }
    return buyer;
  }

  async findByEmail(email: string): Promise<Buyer> {
    return this.buyerRepository.findOne({ where: { email } });
  }

  async update(id: string, updateBuyerDto: UpdateBuyerDto): Promise<Buyer> {
    const buyer = await this.findOne(id);
    Object.assign(buyer, updateBuyerDto);
    return this.buyerRepository.save(buyer);
  }

  async updateLocation(id: string, lat: number, lng: number): Promise<Buyer> {
    const buyer = await this.findOne(id);
    buyer.lat = lat;
    buyer.lng = lng;
    return this.buyerRepository.save(buyer);
  }

  async block(id: string): Promise<Buyer> {
    const buyer = await this.findOne(id);
    buyer.blockedStatus = true;
    return this.buyerRepository.save(buyer);
  }

  async unblock(id: string): Promise<Buyer> {
    const buyer = await this.findOne(id);
    buyer.blockedStatus = false;
    return this.buyerRepository.save(buyer);
  }

  async updateRating(id: string, rating: number): Promise<Buyer> {
    const buyer = await this.findOne(id);
    buyer.rating = rating;
    return this.buyerRepository.save(buyer);
  }

  async findNearby(lat: number, lng: number, radius: number): Promise<Buyer[]> {
    // Using PostgreSQL's earthdistance extension for location-based queries
    return this.buyerRepository
      .createQueryBuilder('buyer')
      .where(
        `point(buyer.lng, buyer.lat) <@> point(:lng, :lat) <= :radius`,
        { lat, lng, radius },
      )
      .andWhere('buyer.blocked_status = false')
      .getMany();
  }
} 