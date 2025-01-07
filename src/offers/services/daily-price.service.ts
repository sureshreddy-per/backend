import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DailyPrice } from '../entities/daily-price.entity';
import { ProduceCategory } from '../../produce/entities/produce.entity';
import { CreateDailyPriceDto } from '../dto/create-daily-price.dto';
import { UpdateDailyPriceDto } from '../dto/update-daily-price.dto';

@Injectable()
export class DailyPriceService {
  constructor(
    @InjectRepository(DailyPrice)
    private readonly dailyPriceRepository: Repository<DailyPrice>,
  ) {}

  async create(createDailyPriceDto: CreateDailyPriceDto): Promise<DailyPrice> {
    // Deactivate any existing active prices for this category and buyer
    await this.dailyPriceRepository.update(
      {
        buyer_id: createDailyPriceDto.buyer_id,
        produce_category: createDailyPriceDto.produce_category,
        is_active: true,
      },
      { is_active: false }
    );

    const dailyPrice = this.dailyPriceRepository.create({
      ...createDailyPriceDto,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      is_active: true,
    });

    return this.dailyPriceRepository.save(dailyPrice);
  }

  async findActive(buyer_id: string, produce_category: ProduceCategory): Promise<DailyPrice | null> {
    return this.dailyPriceRepository.findOne({
      where: {
        buyer_id,
        produce_category,
        is_active: true,
        valid_until: MoreThan(new Date()),
      },
    });
  }

  async findAll(): Promise<DailyPrice[]> {
    return this.dailyPriceRepository.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DailyPrice> {
    const dailyPrice = await this.dailyPriceRepository.findOne({
      where: { id },
    });

    if (!dailyPrice) {
      throw new NotFoundException(`Daily price with ID ${id} not found`);
    }

    return dailyPrice;
  }

  async update(id: string, updateDailyPriceDto: UpdateDailyPriceDto): Promise<DailyPrice> {
    const dailyPrice = await this.findOne(id);
    Object.assign(dailyPrice, updateDailyPriceDto);
    return this.dailyPriceRepository.save(dailyPrice);
  }

  async deactivate(id: string): Promise<void> {
    const dailyPrice = await this.findOne(id);
    dailyPrice.is_active = false;
    await this.dailyPriceRepository.save(dailyPrice);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredPrices() {
    await this.dailyPriceRepository.update(
      {
        valid_until: LessThan(new Date()),
        is_active: true,
      },
      { is_active: false }
    );
  }
} 