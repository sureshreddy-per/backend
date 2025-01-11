import { Injectable, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager, Not, IsNull } from "typeorm";
import { BuyerPreferences } from "../entities/buyer-preferences.entity";
import { BuyersService } from "../buyers.service";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";

@Injectable()
export class BuyerPreferencesService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly buyersService: BuyersService,
  ) {}

  async setPreferences(
    userId: string,
    data: {
      categories?: string[];
      notification_enabled?: boolean;
      notification_methods?: string[];
    },
  ): Promise<BuyerPreferences> {
    const buyer = await this.buyersService.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    let preferences = await this.entityManager.findOne(BuyerPreferences, {
      where: { buyer_id: buyer.id }
    });

    if (!preferences) {
      preferences = this.entityManager.create(BuyerPreferences, {
        buyer_id: buyer.id,
        notification_enabled: true,
      });
    }

    if (data.categories) {
      preferences.categories = data.categories.map(category => category as ProduceCategory);
    }
    if (data.notification_enabled !== undefined) {
      preferences.notification_enabled = data.notification_enabled;
    }
    if (data.notification_methods) {
      preferences.notification_methods = data.notification_methods;
    }

    return this.entityManager.save(BuyerPreferences, preferences);
  }

  async getPreferences(userId: string): Promise<BuyerPreferences> {
    try {
      const buyer = await this.buyersService.findByUserId(userId);
      if (!buyer) {
        throw new NotFoundException(`Buyer not found for user ${userId}`);
      }

      const preferences = await this.entityManager.findOne(BuyerPreferences, {
        where: { buyer_id: buyer.id }
      });

      if (!preferences) {
        // Return default preferences if none exist
        return this.entityManager.create(BuyerPreferences, {
          buyer_id: buyer.id,
          categories: [],
          notification_enabled: true,
          notification_methods: [],
          price_alert_condition: null,
          expiry_date: null,
        });
      }

      return preferences;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get buyer preferences');
    }
  }

  async deletePriceAlert(userId: string, alertId: string): Promise<{ message: string }> {
    const buyer = await this.buyersService.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    const result = await this.entityManager.delete(BuyerPreferences, {
      id: alertId,
      buyer_id: buyer.id,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Price alert ${alertId} not found`);
    }

    return { message: "Price alert deleted successfully" };
  }

  async setPriceAlert(
    userId: string,
    data: {
      target_price: number;
      condition: string;
      notification_methods: string[];
      expiry_date: Date;
    },
  ): Promise<BuyerPreferences> {
    const buyer = await this.buyersService.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    let preferences = await this.entityManager.findOne(BuyerPreferences, {
      where: { buyer_id: buyer.id }
    });

    if (!preferences) {
      preferences = this.entityManager.create(BuyerPreferences, {
        buyer_id: buyer.id,
        notification_enabled: true,
        target_price: data.target_price,
        price_alert_condition: data.condition,
        notification_methods: data.notification_methods,
        expiry_date: data.expiry_date,
      });
    } else {
      preferences.target_price = data.target_price;
      preferences.price_alert_condition = data.condition;
      preferences.notification_methods = data.notification_methods;
      preferences.expiry_date = data.expiry_date;
    }

    try {
      return await this.entityManager.save(BuyerPreferences, preferences);
    } catch (error) {
      console.error('Error saving price alert:', error);
      throw new InternalServerErrorException('Failed to save price alert');
    }
  }

  async getPriceAlerts(userId: string): Promise<BuyerPreferences[]> {
    const buyer = await this.buyersService.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    return this.entityManager.find(BuyerPreferences, {
      where: { 
        buyer_id: buyer.id,
        price_alert_condition: Not(IsNull())
      },
    });
  }

  async updatePriceAlert(
    userId: string,
    alertId: string,
    data: Partial<BuyerPreferences>,
  ): Promise<BuyerPreferences> {
    const buyer = await this.buyersService.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    const alert = await this.entityManager.findOne(BuyerPreferences, {
      where: { id: alertId, buyer_id: buyer.id },
    });

    if (!alert) {
      throw new NotFoundException(`Price alert ${alertId} not found`);
    }

    Object.assign(alert, data);
    return this.entityManager.save(BuyerPreferences, alert);
  }

  async setPreferredPriceRange(
    userId: string,
    data: {
      min_price: number;
      max_price: number;
      categories?: string[];
    },
  ): Promise<BuyerPreferences> {
    const buyer = await this.buyersService.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    let preferences = await this.entityManager.findOne(BuyerPreferences, {
      where: { buyer_id: buyer.id }
    });

    if (!preferences) {
      preferences = this.entityManager.create(BuyerPreferences, {
        buyer_id: buyer.id,
        notification_enabled: true,
      });
    }

    if (data.categories) {
      preferences.categories = data.categories.map(category => category as ProduceCategory);
    }

    return this.entityManager.save(BuyerPreferences, preferences);
  }
} 