import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Buyer } from '../entities/buyer.entity';
import { BuyerPreferences } from '../entities/buyer-preferences.entity';
import { User } from '../../users/entities/user.entity';
import { UpdateUserDetailsDto } from '../dto/update-user-details.dto';
import { CreateBuyerDto } from '../dto/create-buyer.dto';
import { UpdateBuyerPreferencesDto } from '../dto/update-buyer-preferences.dto';

@Injectable()
export class BuyersService {
  private readonly logger = new Logger(BuyersService.name);

  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    @InjectRepository(BuyerPreferences)
    private readonly buyerPreferencesRepository: Repository<BuyerPreferences>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getBuyerWithUser(
    buyer: Buyer,
  ): Promise<Buyer & { user: Partial<User>; total_offers_count: number; total_inspection_completed_count: number }> {
    const user = await this.userRepository.findOne({
      where: { id: buyer.user_id },
      select: [
        "id",
        "email",
        "avatar_url",
        "name",
        "status",
        "mobile_number",
        "role",
        "rating",
        "total_completed_transactions",
        "last_login_at",
        "app_version",
        "fcm_token"
      ],
    });

    if (!user) {
      throw new NotFoundException(
        `User details for buyer ${buyer.id} not found`,
      );
    }

    // Get counts from the existing getBuyerDetails query
    const buyerWithCounts = await this.buyerRepository
      .createQueryBuilder('buyer')
      .leftJoin('buyer.offers', 'offers')
      .leftJoin('offers.produce', 'produce')
      .leftJoin('produce.inspectionRequests', 'inspection')
      .where('buyer.id = :buyerId', { buyerId: buyer.id })
      .select([
        'COUNT(DISTINCT offers.id) as total_offers_count',
        'COUNT(DISTINCT CASE WHEN inspection.status = :inspectionCompleted THEN inspection.id END) as total_inspection_completed_count'
      ])
      .setParameter('inspectionCompleted', 'COMPLETED')
      .getRawOne();

    return {
      ...buyer,
      user,
      total_offers_count: parseInt(buyerWithCounts.total_offers_count) || 0,
      total_inspection_completed_count: parseInt(buyerWithCounts.total_inspection_completed_count) || 0
    };
  }

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

  async getBuyerDetails(userId: string): Promise<any> {
    // First get the buyer with counts
    const buyerWithCounts = await this.buyerRepository
      .createQueryBuilder('buyer')
      .leftJoinAndSelect('buyer.preferences', 'preferences')
      .leftJoin('buyer.offers', 'offers')
      .leftJoin('offers.produce', 'produce')
      .leftJoin('produce.inspectionRequests', 'inspection')
      .where('buyer.user_id = :userId', { userId })
      .select([
        'buyer',
        'preferences',
        'COUNT(DISTINCT offers.id) as total_offers_count',
        'COUNT(DISTINCT CASE WHEN inspection.status = :inspectionCompleted THEN inspection.id END) as total_inspection_completed_count'
      ])
      .setParameter('inspectionCompleted', 'COMPLETED')
      .groupBy('buyer.id')
      .addGroupBy('preferences.id')
      .getRawAndEntities();

    if (!buyerWithCounts.entities[0]) {
      throw new NotFoundException(`Buyer not found for user ${userId}`);
    }

    const buyer = buyerWithCounts.entities[0];
    const raw = buyerWithCounts.raw[0];

    // Get user details
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        "id",
        "email",
        "avatar_url",
        "name",
        "status",
        "mobile_number",
        "role",
        "rating",
        "total_completed_transactions",
        "last_login_at",
        "app_version",
        "fcm_token"
      ],
    });

    if (!user) {
      throw new NotFoundException(`User details not found for user ${userId}`);
    }

    return {
      ...buyer,
      user,
      total_offers_count: parseInt(raw.total_offers_count) || 0,
      total_inspection_completed_count: parseInt(raw.total_inspection_completed_count) || 0
    };
  }

  async updateUserDetails(
    userId: string,
    updateUserDetailsDto: UpdateUserDetailsDto,
  ): Promise<Buyer & { user: Partial<User> }> {
    // First check if the user exists and is a buyer
    const buyer = await this.findByUserId(userId);

    // Update user details
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validate mobile number uniqueness if it's being updated
    if (updateUserDetailsDto.mobile_number) {
      const existingUser = await this.userRepository.findOne({
        where: { 
          mobile_number: updateUserDetailsDto.mobile_number,
          id: Not(userId) // Exclude current user
        }
      });
      if (existingUser) {
        throw new BadRequestException('Mobile number is already in use');
      }
    }

    // Validate email uniqueness if it's being updated
    if (updateUserDetailsDto.email) {
      const existingUser = await this.userRepository.findOne({
        where: { 
          email: updateUserDetailsDto.email,
          id: Not(userId) // Exclude current user
        }
      });
      if (existingUser) {
        throw new BadRequestException('Email is already in use');
      }
    }

    // Extract user fields and buyer fields
    const userFields = {
      name: updateUserDetailsDto.name,
      email: updateUserDetailsDto.email,
      mobile_number: updateUserDetailsDto.mobile_number,
      avatar_url: updateUserDetailsDto.avatar_url,
      status: updateUserDetailsDto.status,
      fcm_token: updateUserDetailsDto.fcm_token,
      app_version: updateUserDetailsDto.app_version,
    };

    const buyerFields = {
      gst: updateUserDetailsDto.gst,
      business_name: updateUserDetailsDto.business_name,
      registration_number: updateUserDetailsDto.registration_number,
      location: updateUserDetailsDto.location,
      location_name: updateUserDetailsDto.location_name,
      address: updateUserDetailsDto.address,
    };

    // Update user fields
    Object.assign(user, userFields);
    await this.userRepository.save(user);

    // Update buyer fields
    Object.assign(buyer, buyerFields);
    await this.buyerRepository.save(buyer);

    // Return the updated buyer with user details
    return this.getBuyerWithUser(buyer);
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

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
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

          const distance = this.calculateDistance(lat, lng, buyerLat, buyerLng);
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