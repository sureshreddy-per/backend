import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Buyer } from "./entities/buyer.entity";
import { BuyerPreferences } from "./entities/buyer-preferences.entity";
import { ProduceCategory } from "../produce/enums/produce-category.enum";

@Injectable()
export class BuyersService {
  private readonly logger = new Logger(BuyersService.name);

  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    @InjectRepository(BuyerPreferences)
    private readonly buyerPreferencesRepository: Repository<BuyerPreferences>,
  ) {}

  async findByPriceRange(price: number): Promise<Buyer[]> {
    try {
      this.logger.debug(`Finding buyers by price range: ${price}`);
      const buyers = await this.buyerRepository.find();
      this.logger.debug(`Found ${buyers.length} buyers`);
      return buyers;
    } catch (error) {
      this.logger.error(`Error finding buyers by price range: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findNearby(location: string, radiusKm: number): Promise<Buyer[]> {
    try {
      this.logger.debug(`Finding nearby buyers at location: ${location}, radius: ${radiusKm}`);
      const [lat, lng] = location.split(",").map((coord) => parseFloat(coord));
      const buyers = await this.buyerRepository.find();

      const nearbyBuyers = buyers.filter((buyer) => {
        if (!buyer.lat_lng) return false;
        const [buyerLat, buyerLng] = buyer.lat_lng
          .split(",")
          .map((coord) => parseFloat(coord));

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
      });

      this.logger.debug(`Found ${nearbyBuyers.length} nearby buyers`);
      return nearbyBuyers;
    } catch (error) {
      this.logger.error(`Error finding nearby buyers: ${error.message}`, error.stack);
      throw error;
    }
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async createBuyer(
    user_id: string,
    buyerData: Partial<Buyer>,
  ): Promise<Buyer> {
    try {
      this.logger.debug(`Creating buyer for user ${user_id}`);
      // Convert hyphen-separated lat_lng to comma-separated format if present
      if (buyerData.lat_lng) {
        buyerData.lat_lng = buyerData.lat_lng.replace('-', ',');
      }

      const buyer = this.buyerRepository.create({
        user_id,
        ...buyerData,
        is_active: true,
      });

      const result = await this.buyerRepository.save(buyer);
      this.logger.debug(`Buyer created successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error creating buyer: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Buyer> {
    try {
      this.logger.debug(`Finding buyer by user ID: ${userId}`);
      const buyer = await this.buyerRepository.findOne({ where: { user_id: userId } });
      if (!buyer) {
        throw new NotFoundException(`Buyer not found for user ${userId}`);
      }

      // Ensure response uses comma format
      if (buyer.lat_lng) {
        buyer.lat_lng = buyer.lat_lng.replace('-', ',');
      }

      this.logger.debug(`Buyer found: ${JSON.stringify(buyer)}`);
      return buyer;
    } catch (error) {
      this.logger.error(`Error finding buyer by user ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<Buyer> {
    try {
      this.logger.debug(`Finding buyer by ID: ${id}`);
      const buyer = await this.buyerRepository.findOne({ where: { id } });
      if (!buyer) {
        throw new NotFoundException(`Buyer not found with ID ${id}`);
      }

      // Ensure response uses comma format
      if (buyer.lat_lng) {
        buyer.lat_lng = buyer.lat_lng.replace('-', ',');
      }

      this.logger.debug(`Buyer found: ${JSON.stringify(buyer)}`);
      return buyer;
    } catch (error) {
      this.logger.error(`Error finding buyer by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findNearbyBuyers(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<Buyer[]> {
    try {
      this.logger.debug(`Finding nearby buyers at lat: ${lat}, lng: ${lng}, radius: ${radiusKm}`);
      if (!lat || !lng || !radiusKm) {
        throw new Error(
          "Invalid parameters: latitude, longitude and radius are required",
        );
      }

      if (radiusKm <= 0 || radiusKm > 100) {
        throw new Error("Radius must be between 0 and 100 kilometers");
      }

      const buyers = await this.buyerRepository.find({
        where: {
          is_active: true,
        },
      });

      const nearbyBuyers = buyers.filter((buyer) => {
        try {
          if (!buyer.lat_lng) return false;

          // Convert hyphen to comma format if needed
          buyer.lat_lng = buyer.lat_lng.replace('-', ',');

          const [buyerLat, buyerLng] = buyer.lat_lng.split(",").map((coord) => {
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
            `Error calculating distance for buyer ${buyer.id}: ${error.message}`,
          );
          return false;
        }
      });

      // Ensure all lat_lng values in the response use comma format
      nearbyBuyers.forEach(buyer => {
        if (buyer.lat_lng) {
          buyer.lat_lng = buyer.lat_lng.replace('-', ',');
        }
      });

      this.logger.debug(`Found ${nearbyBuyers.length} nearby buyers`);
      return nearbyBuyers;
    } catch (error) {
      this.logger.error(`Error finding nearby buyers: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBuyerDetails(userId: string): Promise<Buyer> {
    try {
      this.logger.debug(`Getting buyer details for user ${userId}`);
      const buyer = await this.findByUserId(userId);
      this.logger.debug(`Buyer details found: ${JSON.stringify(buyer)}`);
      return buyer;
    } catch (error) {
      this.logger.error(`Error getting buyer details: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateBuyerDetails(
    userId: string,
    updateData: Partial<Buyer>,
  ): Promise<Buyer> {
    try {
      this.logger.debug(`Updating buyer details for user ${userId}`);
      const buyer = await this.findByUserId(userId);

      // Convert hyphen-separated lat_lng to comma-separated format if present
      if (updateData.lat_lng) {
        updateData.lat_lng = updateData.lat_lng.replace('-', ',');
      }

      Object.assign(buyer, updateData);
      const result = await this.buyerRepository.save(buyer);

      // Ensure response uses comma format
      if (result.lat_lng) {
        result.lat_lng = result.lat_lng.replace('-', ',');
      }

      this.logger.debug(`Buyer details updated: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error updating buyer details: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBuyerDetailsByOfferId(
    offerId: string,
    userId: string,
  ): Promise<Buyer> {
    try {
      this.logger.debug(`Getting buyer details for offer ${offerId} and user ${userId}`);
      const buyer = await this.buyerRepository
        .createQueryBuilder("buyer")
        .innerJoin("buyer.offers", "offer", "offer.id = :offerId", { offerId })
        .where("buyer.user_id = :userId", { userId })
        .getOne();

      if (!buyer) {
        throw new NotFoundException(`Buyer not found for offer ${offerId}`);
      }

      this.logger.debug(`Buyer details found: ${JSON.stringify(buyer)}`);
      return buyer;
    } catch (error) {
      this.logger.error(`Error getting buyer details by offer: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBuyerPreferences(userId: string) {
    try {
      this.logger.debug(`Getting buyer preferences for user ${userId}`);
      const buyer = await this.findByUserId(userId);
      if (!buyer) {
        throw new NotFoundException(`Buyer not found for user ${userId}`);
      }

      // Ensure buyer's lat_lng uses comma format
      if (buyer.lat_lng) {
        buyer.lat_lng = buyer.lat_lng.replace('-', ',');
      }

      const preferences = await this.buyerPreferencesRepository.findOne({
        where: { buyer_id: buyer.id }
      });

      if (!preferences) {
        // Return default preferences if none exist
        return {
          categories: [],
          location: buyer.lat_lng ? {
            lat: parseFloat(buyer.lat_lng.split(',')[0]),
            lng: parseFloat(buyer.lat_lng.split(',')[1])
          } : null,
          location_name: buyer.location_name,
          address: buyer.address,
          notification_enabled: true,
          notification_methods: [],
          price_alert_condition: null,
          expiry_date: null
        };
      }

      const result = {
        categories: preferences.categories,
        location: buyer.lat_lng ? {
          lat: parseFloat(buyer.lat_lng.split(',')[0]),
          lng: parseFloat(buyer.lat_lng.split(',')[1])
        } : null,
        location_name: buyer.location_name,
        address: buyer.address,
        notification_enabled: preferences.notification_enabled,
        notification_methods: preferences.notification_methods,
        price_alert_condition: preferences.price_alert_condition,
        expiry_date: preferences.expiry_date
      };

      return result;
    } catch (error) {
      this.logger.error('Error in getBuyerPreferences:', error);
      throw error;
    }
  }

  async updatePriceRangePreferences(
    userId: string,
    data: { categories?: string[] }
  ): Promise<BuyerPreferences> {
    try {
      this.logger.debug(`Updating preferences for user ${userId}`);
      const buyer = await this.findByUserId(userId);
      if (!buyer) {
        throw new NotFoundException(`Buyer not found for user ${userId}`);
      }

      let preferences = await this.buyerPreferencesRepository.findOne({
        where: { buyer_id: buyer.id }
      });

      if (!preferences) {
        preferences = this.buyerPreferencesRepository.create({
          buyer_id: buyer.id,
          notification_enabled: true
        });
      }

      if (data.categories) {
        preferences.categories = data.categories.map(category => category as ProduceCategory);
      }

      const result = await this.buyerPreferencesRepository.save(preferences);
      this.logger.debug(`Preferences updated: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error updating preferences: ${error.message}`, error.stack);
      throw error;
    }
  }
}
