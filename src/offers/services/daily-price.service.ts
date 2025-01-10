import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { DailyPrice } from '../entities/daily-price.entity';
import { ProduceCategory } from '../../produce/enums/produce-category.enum';
import { CreateDailyPriceDto } from '../dto/create-daily-price.dto';
import { UpdateDailyPriceDto } from '../dto/update-daily-price.dto';

@Injectable()
export class DailyPriceService {
  constructor(
    @InjectRepository(DailyPrice)
    private readonly dailyPriceRepository: Repository<DailyPrice>
  ) {}

  async create(createDailyPriceDto: CreateDailyPriceDto): Promise<DailyPrice> {
    // Deactivate any existing active prices for this category
    await this.deactivateExistingPrices(
      createDailyPriceDto.buyer_id,
      createDailyPriceDto.produce_category
    );

    const dailyPrice = this.dailyPriceRepository.create({
      ...createDailyPriceDto,
      is_active: true,
      valid_from: new Date(),
      valid_until: this.calculateValidUntil(createDailyPriceDto.valid_days || 1)
    });

    return this.dailyPriceRepository.save(dailyPrice);
  }

  async findActive(buyer_id: string, category: ProduceCategory): Promise<DailyPrice | null> {
    const now = new Date();
    
    return this.dailyPriceRepository.findOne({
      where: {
        buyer_id,
        produce_category: category,
        is_active: true,
        valid_from: LessThanOrEqual(now),
        valid_until: MoreThanOrEqual(now)
      }
    });
  }

  async findAllActive(buyer_id: string): Promise<DailyPrice[]> {
    const now = new Date();
    
    return this.dailyPriceRepository.find({
      where: {
        buyer_id,
        is_active: true,
        valid_from: LessThanOrEqual(now),
        valid_until: MoreThanOrEqual(now)
      }
    });
  }

  async update(id: string, updateDailyPriceDto: UpdateDailyPriceDto): Promise<DailyPrice> {
    const dailyPrice = await this.dailyPriceRepository.findOne({
      where: { id }
    });

    if (!dailyPrice) {
      throw new NotFoundException('Daily price not found');
    }

    // If extending validity
    if (updateDailyPriceDto.valid_days) {
      updateDailyPriceDto.valid_until = this.calculateValidUntil(updateDailyPriceDto.valid_days);
    }

    await this.dailyPriceRepository.update(id, updateDailyPriceDto);
    return this.dailyPriceRepository.findOne({ where: { id } });
  }

  async deactivate(id: string): Promise<void> {
    const dailyPrice = await this.dailyPriceRepository.findOne({
      where: { id }
    });

    if (!dailyPrice) {
      throw new NotFoundException('Daily price not found');
    }

    await this.dailyPriceRepository.update(id, {
      is_active: false,
      valid_until: new Date()
    });
  }

  private async deactivateExistingPrices(buyer_id: string, category: ProduceCategory): Promise<void> {
    const now = new Date();
    
    await this.dailyPriceRepository.update(
      {
        buyer_id,
        produce_category: category,
        is_active: true,
        valid_until: MoreThanOrEqual(now)
      },
      {
        is_active: false,
        valid_until: now
      }
    );
  }

  private calculateValidUntil(days: number): Date {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + days);
    validUntil.setHours(23, 59, 59, 999);
    return validUntil;
  }
} 