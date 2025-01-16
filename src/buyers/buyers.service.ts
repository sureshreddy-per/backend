import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buyer } from './entities/buyer.entity';
import { BuyerPreferences } from './entities/buyer-preferences.entity';
import { UpdateBuyerPreferencesDto } from './dto/update-buyer-preferences.dto';
import { CreateBuyerDto } from './dto/create-buyer.dto';

@Injectable()
export class BuyersService {
  private readonly logger = new Logger(BuyersService.name);

  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    @InjectRepository(BuyerPreferences)
    private readonly buyerPreferencesRepository: Repository<BuyerPreferences>,
  ) {}

  async findByUserId(userId: string): Promise<Buyer> {
    const buyer = await this.buyerRepository.findOne({
      where: { user_id: userId },
      relations: ["preferences"],
    });

    if (!buyer) {
      throw new NotFoundException(`Buyer with user ID ${userId} not found`);
    }

    return buyer;
  }

  async findOne(id: string): Promise<Buyer> {
    const buyer = await this.buyerRepository.findOne({
      where: { id },
      relations: ['preferences']
    });

    if (!buyer) {
      throw new NotFoundException(`Buyer ${id} not found`);
    }

    return buyer;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async createBuyer(userId: string, buyerData: CreateBuyerDto): Promise<Buyer> {
    try {
      this.logger.debug(`Creating buyer for user ${userId}`);

      const buyer = this.buyerRepository.create({
        user_id: userId,
        ...buyerData,
        is_active: true,
      });

      const result = await this.buyerRepository.save(buyer);

      // Create default preferences
      await this.buyerPreferencesRepository.save(
        this.buyerPreferencesRepository.create({
          buyer_id: result.id,
          produce_names: [],
          notification_enabled: true,
          notification_methods: []
        })
      );

      this.logger.debug(`Buyer created successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error creating buyer: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBuyerDetails(userId: string): Promise<Buyer> {
    const buyer = await this.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    return buyer;
  }

  async updateBuyerDetails(userId: string, updateData: Partial<Buyer>): Promise<Buyer> {
    const buyer = await this.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    Object.assign(buyer, updateData);
    const result = await this.buyerRepository.save(buyer);

    return result;
  }

  async getBuyerDetailsByOfferId(offerId: string, userId: string): Promise<Buyer> {
    const buyer = await this.buyerRepository
      .createQueryBuilder("buyer")
      .innerJoin("buyer.offers", "offer", "offer.id = :offerId", { offerId })
      .where("buyer.user_id = :userId", { userId })
      .getOne();

    if (!buyer) {
      throw new NotFoundException(`Buyer not found for offer ${offerId}`);
    }

    return buyer;
  }

  async findNearbyBuyers(lat: number, lng: number, radiusKm: number): Promise<Buyer[]> {
    try {
      this.logger.debug(`Finding nearby buyers at lat: ${lat}, lng: ${lng}, radius: ${radiusKm}`);
      if (!lat || !lng || !radiusKm) {
        throw new Error("Invalid parameters: latitude, longitude and radius are required");
      }

      if (radiusKm <= 0 || radiusKm > 100) {
        throw new Error("Radius must be between 0 and 100 kilometers");
      }

      const buyers = await this.buyerRepository.find({
        where: { is_active: true },
        relations: ['preferences']
      });

      const nearbyBuyers = buyers.filter((buyer) => {
        try {
          if (!buyer.location) return false;

          const [buyerLat, buyerLng] = buyer.location.split(",").map((coord) => {
            const parsed = parseFloat(coord);
            if (isNaN(parsed)) throw new Error("Invalid coordinates format");
            return parsed;
          });

          if (Math.abs(buyerLat) > 90 || Math.abs(buyerLng) > 180) {
            return false; // Invalid coordinates
          }

          const R = 6371; // Earth's radius in km
          const dLat = this.toRad(buyerLat - lat);
          const dLon = this.toRad(buyerLng - lng);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat)) *
              Math.cos(this.toRad(buyerLat)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return distance <= radiusKm;
        } catch (error) {
          this.logger.error(
            `Error calculating distance for buyer ${buyer.id}: ${error.message}`
          );
          return false;
        }
      });

      return nearbyBuyers;
    } catch (error) {
      this.logger.error(`Error finding nearby buyers: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updatePreferences(userId: string, data: UpdateBuyerPreferencesDto): Promise<Buyer> {
    const buyer = await this.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    const preferences = await this.buyerPreferencesRepository.findOne({
      where: { buyer_id: buyer.id }
    });

    if (!preferences) {
      throw new NotFoundException(`Preferences not found for buyer ${buyer.id}`);
    }

    // Update preferences
    if (data.produce_names) {
      preferences.produce_names = data.produce_names;
    }

    if (data.notification_enabled !== undefined) {
      preferences.notification_enabled = data.notification_enabled;
    }

    if (data.notification_methods) {
      preferences.notification_methods = data.notification_methods;
    }

    await this.buyerPreferencesRepository.save(preferences);
    return this.findOne(buyer.id);
  }

  async getPreferences(userId: string): Promise<any> {
    const buyer = await this.findByUserId(userId);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    const preferences = await this.buyerPreferencesRepository.findOne({
      where: { buyer_id: buyer.id }
    });

    if (!preferences) {
      return {
        buyer_id: buyer.id,
        produce_names: [],
        notification_enabled: true,
        notification_methods: []
      };
    }

    return {
      buyer_id: buyer.id,
      produce_names: preferences.produce_names,
      notification_enabled: preferences.notification_enabled,
      notification_methods: preferences.notification_methods
    };
  }
}
