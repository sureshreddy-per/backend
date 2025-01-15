import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { DailyPrice } from '../entities/daily-price.entity';

export interface CreateDailyPriceDto {
  produce_name: string;
  min_price: number;
  max_price: number;
  average_price: number;
  market_name?: string;
  location?: string;
}

@Injectable()
export class DailyPriceService {
  constructor(
    @InjectRepository(DailyPrice)
    private readonly dailyPriceRepository: Repository<DailyPrice>,
  ) {}

  async create(createDailyPriceDto: CreateDailyPriceDto): Promise<DailyPrice> {
    const dailyPrice = this.dailyPriceRepository.create({
      produce_name: createDailyPriceDto.produce_name,
      min_price: createDailyPriceDto.min_price,
      max_price: createDailyPriceDto.max_price,
      average_price: createDailyPriceDto.average_price,
      market_name: createDailyPriceDto.market_name,
      location: createDailyPriceDto.location,
    });

    return this.dailyPriceRepository.save(dailyPrice);
  }

  async findAll(): Promise<DailyPrice[]> {
    return this.dailyPriceRepository.find();
  }

  async findOne(id: string): Promise<DailyPrice> {
    const dailyPrice = await this.dailyPriceRepository.findOne({
      where: { id }
    });

    if (!dailyPrice) {
      throw new NotFoundException(`Daily price with ID ${id} not found`);
    }

    return dailyPrice;
  }

  async update(id: string, updateData: Partial<DailyPrice>): Promise<DailyPrice> {
    const dailyPrice = await this.findOne(id);

    Object.assign(dailyPrice, updateData);
    return this.dailyPriceRepository.save(dailyPrice);
  }

  async remove(id: string): Promise<void> {
    const dailyPrice = await this.findOne(id);
    await this.dailyPriceRepository.remove(dailyPrice);
  }

  async findByProduceName(produceName: string): Promise<DailyPrice[]> {
    return this.dailyPriceRepository.find({
      where: { produce_name: produceName }
    });
  }

  async findLatestByProduceName(produceName: string): Promise<DailyPrice | null> {
    return this.dailyPriceRepository.findOne({
      where: { produce_name: produceName },
      order: { created_at: 'DESC' }
    });
  }
}
