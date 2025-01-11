import { Injectable, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BuyerPreferences } from "../entities/buyer-preferences.entity";
import { BuyersService } from "../buyers.service";

@Injectable()
export class BuyerPreferencesService {
  constructor(
    @InjectRepository(BuyerPreferences)
    private readonly preferencesRepository: Repository<BuyerPreferences>,
    private readonly buyersService: BuyersService,
  ) {}

  async setPriceAlert(
    userId: string,
    data: {
      target_price: number;
      condition: string;
      notification_methods: string[];
      expiry_date: Date;
    },
  ): Promise<BuyerPreferences> {
    try {
      console.log('Setting price alert for user:', userId);
      console.log('Data:', data);
      
      const buyer = await this.buyersService.findByUserId(userId);
      if (!buyer) {
        throw new NotFoundException(`Buyer not found for user ${userId}`);
      }

      console.log('Found buyer:', buyer);

      let preferences = await this.preferencesRepository.findOne({
        where: { buyer_id: buyer.id },
      });

      if (!preferences) {
        preferences = this.preferencesRepository.create({
          buyer_id: buyer.id,
        });
      }

      preferences.target_price = data.target_price;
      preferences.price_alert_condition = data.condition;
      preferences.notification_methods = data.notification_methods;
      preferences.expiry_date = data.expiry_date;
      preferences.notification_enabled = true;

      console.log('Saving preferences:', preferences);
      return this.preferencesRepository.save(preferences);
    } catch (error) {
      console.error('Error in setPriceAlert:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        query: error.query,
        parameters: error.parameters
      });
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to set price alert');
    }
  }

  async getPriceAlerts(userId: string): Promise<BuyerPreferences> {
    const buyer = await this.buyersService.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    const preferences = await this.preferencesRepository.findOne({
      where: { buyer_id: buyer.id },
    });

    if (!preferences) {
      throw new NotFoundException(`No preferences found for buyer ${buyer.id}`);
    }

    return preferences;
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

    const preferences = await this.preferencesRepository.findOne({
      where: { id: alertId, buyer_id: buyer.id },
    });

    if (!preferences) {
      throw new NotFoundException(`Price alert ${alertId} not found`);
    }

    Object.assign(preferences, data);
    return this.preferencesRepository.save(preferences);
  }

  async deletePriceAlert(userId: string, alertId: string): Promise<{ message: string }> {
    const buyer = await this.buyersService.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    const result = await this.preferencesRepository.delete({
      id: alertId,
      buyer_id: buyer.id,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Price alert ${alertId} not found`);
    }

    return { message: "Price alert deleted successfully" };
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

    let preferences = await this.preferencesRepository.findOne({
      where: { buyer_id: buyer.id },
    });

    if (!preferences) {
      preferences = this.preferencesRepository.create({
        buyer_id: buyer.id,
      });
    }

    preferences.min_price = data.min_price;
    preferences.max_price = data.max_price;
    preferences.categories = data.categories;

    return this.preferencesRepository.save(preferences);
  }

  async getPreferences(userId: string): Promise<BuyerPreferences[]> {
    try {
      console.log('Getting preferences for user:', userId);
      
      const buyer = await this.buyersService.findByUserId(userId);
      console.log('Found buyer:', buyer);
      
      if (!buyer) {
        throw new NotFoundException(`Buyer not found for user ${userId}`);
      }

      console.log('Searching preferences for buyer_id:', buyer.id);
      const preferences = await this.preferencesRepository.find({
        where: { buyer_id: buyer.id },
      });
      console.log('Found preferences:', preferences);

      return preferences;
    } catch (error) {
      console.error('Error in getPreferences:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        query: error.query,
        parameters: error.parameters
      });
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get buyer preferences');
    }
  }
} 