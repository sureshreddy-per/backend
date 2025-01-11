import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager, LessThanOrEqual, MoreThanOrEqual, Between } from "typeorm";
import { DailyPrice } from "../entities/daily-price.entity";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { CreateDailyPriceDto } from "../dto/create-daily-price.dto";
import { UpdateDailyPriceDto } from "../dto/update-daily-price.dto";
import { SystemConfigService } from "../../config/services/system-config.service";
import { SystemConfigKey } from "../../config/enums/system-config-key.enum";
import { Buyer } from "../../buyers/entities/buyer.entity";

@Injectable()
export class DailyPriceService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  async create(createDailyPriceDto: CreateDailyPriceDto): Promise<DailyPrice> {
    try {
      // Get the buyer to verify it exists
      const buyer = await this.entityManager.findOneBy(Buyer, { id: createDailyPriceDto.buyer_id });
      if (!buyer) {
        throw new NotFoundException('Buyer not found');
      }

      // Deactivate any existing active prices for this category
      await this.deactivateExistingPrices(
        createDailyPriceDto.buyer_id,
        createDailyPriceDto.produce_category,
      );

      const dailyPrice = this.entityManager.create(DailyPrice, {
        ...createDailyPriceDto,
        is_active: true,
        valid_from: new Date(),
        valid_until: this.calculateValidUntil(
          createDailyPriceDto.valid_days || 1,
        ),
        update_count: 0,
      });

      return await this.entityManager.save(dailyPrice);
    } catch (error) {
      console.error('Error creating daily price:', error);
      throw new InternalServerErrorException('Failed to create daily price');
    }
  }

  async update(
    id: string,
    updateDailyPriceDto: UpdateDailyPriceDto,
  ): Promise<DailyPrice> {
    try {
      const dailyPrice = await this.entityManager.findOneBy(DailyPrice, { id });

      if (!dailyPrice) {
        throw new NotFoundException("Daily price not found");
      }

      // Check update count for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const updateCount = await this.entityManager.countBy(DailyPrice, {
        buyer_id: dailyPrice.buyer_id,
        produce_category: dailyPrice.produce_category,
        updated_at: Between(today, tomorrow),
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
      return await this.entityManager.save(dailyPrice);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error updating daily price:', error);
      throw new InternalServerErrorException('Failed to update daily price');
    }
  }

  async findActive(
    buyer_id: string,
    category: ProduceCategory,
  ): Promise<DailyPrice | null> {
    try {
      // Verify buyer exists
      const buyer = await this.entityManager.findOneBy(Buyer, { id: buyer_id });
      if (!buyer) {
        throw new NotFoundException('Buyer not found');
      }

      const now = new Date();

      return await this.entityManager.findOneBy(DailyPrice, {
        buyer_id,
        produce_category: category,
        is_active: true,
        valid_from: LessThanOrEqual(now),
        valid_until: MoreThanOrEqual(now),
      });
    } catch (error) {
      console.error('Error finding active daily price:', error);
      throw new InternalServerErrorException('Failed to find active daily price');
    }
  }

  async findAllActive(buyer_id: string): Promise<DailyPrice[]> {
    try {
      // Verify buyer exists
      const buyer = await this.entityManager.findOneBy(Buyer, { id: buyer_id });
      if (!buyer) {
        throw new NotFoundException('Buyer not found');
      }

      const now = new Date();

      return await this.entityManager.findBy(DailyPrice, {
        buyer_id,
        is_active: true,
        valid_from: LessThanOrEqual(now),
        valid_until: MoreThanOrEqual(now),
      });
    } catch (error) {
      console.error('Error finding active daily prices:', error);
      throw new InternalServerErrorException('Failed to find active daily prices');
    }
  }

  async deactivate(id: string): Promise<{ message: string }> {
    try {
      const dailyPrice = await this.entityManager.findOneBy(DailyPrice, { id });

      if (!dailyPrice) {
        throw new NotFoundException("Daily price not found");
      }

      dailyPrice.is_active = false;
      dailyPrice.valid_until = new Date();
      await this.entityManager.save(dailyPrice);

      return { message: "Daily price deactivated successfully" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deactivating daily price:', error);
      throw new InternalServerErrorException('Failed to deactivate daily price');
    }
  }

  private async deactivateExistingPrices(
    buyer_id: string,
    category: ProduceCategory,
  ): Promise<void> {
    try {
      const now = new Date();
      const existingPrices = await this.entityManager.findBy(DailyPrice, {
        buyer_id,
        produce_category: category,
        is_active: true,
        valid_until: MoreThanOrEqual(now),
      });

      if (existingPrices.length > 0) {
        for (const price of existingPrices) {
          price.is_active = false;
          price.valid_until = now;
        }
        await this.entityManager.save(existingPrices);
      }
    } catch (error) {
      console.error('Error deactivating existing prices:', error);
      throw new InternalServerErrorException('Failed to deactivate existing prices');
    }
  }

  private calculateValidUntil(days: number): Date {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + days);
    validUntil.setHours(23, 59, 59, 999);
    return validUntil;
  }

  async getRemainingUpdates(buyer_id: string): Promise<number> {
    try {
      const updateCount = await this.getDailyUpdateCount(buyer_id);
      const maxUpdates = await this.systemConfigService.getValue(
        SystemConfigKey.MAX_DAILY_PRICE_UPDATES,
      ) as number;

      return Math.max(0, maxUpdates - updateCount);
    } catch (error) {
      console.error('Error getting remaining updates:', error);
      throw new InternalServerErrorException('Failed to get remaining updates');
    }
  }

  async validateUpdateLimit(buyer_id: string): Promise<void> {
    try {
      const updateCount = await this.getDailyUpdateCount(buyer_id);
      const maxUpdates = await this.systemConfigService.getValue(
        SystemConfigKey.MAX_DAILY_PRICE_UPDATES,
      ) as number;

      if (updateCount >= maxUpdates) {
        throw new BadRequestException(
          `Daily price update limit (${maxUpdates}) reached for buyer ${buyer_id}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error validating update limit:', error);
      throw new InternalServerErrorException('Failed to validate update limit');
    }
  }

  private async getDailyUpdateCount(buyer_id: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await this.entityManager.countBy(DailyPrice, {
        buyer_id,
        updated_at: Between(today, tomorrow),
      });
    } catch (error) {
      console.error('Error getting daily update count:', error);
      throw new InternalServerErrorException('Failed to get daily update count');
    }
  }
}
