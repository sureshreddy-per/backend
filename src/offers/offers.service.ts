import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
  ) {}

  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    const offer = this.offerRepository.create(createOfferDto);
    return this.offerRepository.save(offer);
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResponse<Offer>> {
    const [items, total] = await this.offerRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['produce', 'buyer'],
      order: { created_at: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ['produce', 'buyer'],
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    return offer;
  }

  async findByBuyer(buyerId: string, page = 1, limit = 10): Promise<PaginatedResponse<Offer>> {
    const [items, total] = await this.offerRepository.findAndCount({
      where: { buyer_id: buyerId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['produce', 'buyer'],
      order: { created_at: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByProduce(produceId: string, page = 1, limit = 10): Promise<PaginatedResponse<Offer>> {
    const [items, total] = await this.offerRepository.findAndCount({
      where: { produce_id: produceId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['produce', 'buyer'],
      order: { created_at: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
} 