import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from "typeorm";
import { DailyPrice } from "../entities/daily-price.entity";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { CreateDailyPriceDto } from "../dto/create-daily-price.dto";
import { UpdateDailyPriceDto } from "../dto/update-daily-price.dto";
import { SystemConfigService } from "../../config/services/system-config.service";
import { SystemConfigKey } from "../../config/enums/system-config-key.enum";

@Injectable()
export class DailyPriceService {
  constructor(
    @InjectRepository(DailyPrice)
    private readonly dailyPriceRepository: Repository<DailyPrice>,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  async create(createDailyPriceDto: CreateDailyPriceDto): Promise<DailyPrice> {
    // Deactivate any existing active prices for this category
    await this.deactivateExistingPrices(
      createDailyPriceDto.buyer_id,
      createDailyPriceDto.produce_category,
    );

    const dailyPrice = this.dailyPriceRepository.create({
      ...createDailyPriceDto,
      is_active: true,
      valid_from: new Date(),
      valid_until: this.calculateValidUntil(
        createDailyPriceDto.valid_days || 1,
      ),
      update_count: 0,
    });

    return this.dailyPriceRepository.save(dailyPrice);
  }

  async update(
    id: string,
    updateDailyPriceDto: UpdateDailyPriceDto,
  ): Promise<DailyPrice> {
    const dailyPrice = await this.dailyPriceRepository.findOne({
      where: { id },
    });

    if (!dailyPrice) {
      throw new NotFoundException("Daily price not found");
    }

    // Check update count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const updateCount = await this.dailyPriceRepository.count({
      where: {
        buyer_id: dailyPrice.buyer_id,
        produce_category: dailyPrice.produce_category,
        updated_at: Between(today, tomorrow),
      },
    });

    const maxUpdates = await this.systemConfigService.getValue(
      SystemConfigKey.MAX_DAILY_PRICE_UPDATES,
    );

    if (typeof maxUpdates === 'number' && updateCount >= maxUpdates) {
      throw new BadRequestException(
        `You can only update prices ${maxUpdates} times per day`,
      );
    }

    // If extending validity
    if (updateDailyPriceDto.valid_days) {
      updateDailyPriceDto.valid_until = this.calculateValidUntil(
        updateDailyPriceDto.valid_days,
      );
    }

    // Increment update count
    dailyPrice.update_count = (dailyPrice.update_count || 0) + 1;

    // Update the price
    Object.assign(dailyPrice, updateDailyPriceDto);
    return this.dailyPriceRepository.save(dailyPrice);
  }

  async findActive(
    buyer_id: string,
    category: ProduceCategory,
  ): Promise<DailyPrice | null> {
    const now = new Date();

    return this.dailyPriceRepository.findOne({
      where: {
        buyer_id,
        produce_category: category,
        is_active: true,
        valid_from: LessThanOrEqual(now),
        valid_until: MoreThanOrEqual(now),
      },
    });
  }

  async findAllActive(buyer_id: string): Promise<DailyPrice[]> {
    const now = new Date();

    return this.dailyPriceRepository.find({
      where: {
        buyer_id,
        is_active: true,
        valid_from: LessThanOrEqual(now),
        valid_until: MoreThanOrEqual(now),
      },
    });
  }

  async deactivate(id: string): Promise<{ message: string }> {
    const dailyPrice = await this.dailyPriceRepository.findOne({
      where: { id },
    });

    if (!dailyPrice) {
      throw new NotFoundException("Daily price not found");
    }

    await this.dailyPriceRepository.update(id, {
      is_active: false,
      valid_until: new Date(),
    });

    return { message: "Daily price deactivated successfully" };
  }

  private async deactivateExistingPrices(
    buyer_id: string,
    category: ProduceCategory,
  ): Promise<void> {
    const now = new Date();

    await this.dailyPriceRepository.update(
      {
        buyer_id,
        produce_category: category,
        is_active: true,
        valid_until: MoreThanOrEqual(now),
      },
      {
        is_active: false,
        valid_until: now,
      },
    );
  }

  private calculateValidUntil(days: number): Date {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + days);
    validUntil.setHours(23, 59, 59, 999);
    return validUntil;
  }

  async getRemainingUpdates(buyer_id: string): Promise<number> {
    const updateCount = await this.getDailyUpdateCount(buyer_id);
    const maxUpdates = await this.systemConfigService.getValue(
      SystemConfigKey.MAX_DAILY_PRICE_UPDATES,
    ) as number;

    return Math.max(0, maxUpdates - updateCount);
  }

  async validateUpdateLimit(buyer_id: string): Promise<void> {
    const updateCount = await this.getDailyUpdateCount(buyer_id);
    const maxUpdates = await this.systemConfigService.getValue(
      SystemConfigKey.MAX_DAILY_PRICE_UPDATES,
    ) as number;

    if (updateCount >= maxUpdates) {
      throw new BadRequestException(
        `Daily price update limit (${maxUpdates}) reached for buyer ${buyer_id}`,
      );
    }
  }

  private async getDailyUpdateCount(buyer_id: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.dailyPriceRepository.count({
      where: {
        buyer_id,
        updated_at: Between(today, tomorrow),
      },
    });
  }
}
