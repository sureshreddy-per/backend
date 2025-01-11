import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Farmer } from "./entities/farmer.entity";
import { Farm } from "./entities/farm.entity";
import { BankAccount } from "./entities/bank-account.entity";
import { CreateFarmDto } from "./dto/create-farm.dto";
import { UpdateFarmDto } from "./dto/update-farm.dto";
import { CreateBankAccountDto } from "./dto/create-bank-account.dto";
import { UpdateBankAccountDto } from "./dto/update-bank-account.dto";
import { UpdateUserDetailsDto } from "./dto/update-user-details.dto";
import { User } from "../users/entities/user.entity";
import { Offer } from "../offers/entities/offer.entity";
import { validateLocation } from "../common/utils/location.utils";
import { SystemConfigService } from "../config/services/system-config.service";
import { SystemConfigKey } from "../config/enums/system-config-key.enum";
import { Not, IsNull, In } from "typeorm";

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(Farmer)
    private readonly farmerRepository: Repository<Farmer>,
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  private async getFarmerWithUser(
    farmer: Farmer,
  ): Promise<Farmer & { user: Partial<User> }> {
    const user = await this.userRepository.findOne({
      where: { id: farmer.user_id },
      select: ["id", "email", "avatar_url", "name", "status"],
    });

    if (!user) {
      throw new NotFoundException(
        `User details for farmer ${farmer.id} not found`,
      );
    }

    return { ...farmer, user };
  }

  async createFarmer(
    userId: string,
  ): Promise<Farmer & { user: Partial<User> }> {
    const farmer = this.farmerRepository.create({
      user_id: userId,
    });
    const savedFarmer = await this.farmerRepository.save(farmer);
    return this.getFarmerWithUser(savedFarmer);
  }

  async findOne(id: string): Promise<Farmer & { user: Partial<User> }> {
    const farmer = await this.farmerRepository.findOne({
      where: { id },
      relations: ["farms", "bank_accounts"],
    });
    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${id} not found`);
    }
    return this.getFarmerWithUser(farmer);
  }

  async findByUserId(
    userId: string,
  ): Promise<Farmer & { user: Partial<User> }> {
    const farmer = await this.farmerRepository.findOne({
      where: { user_id: userId },
      relations: ["farms", "bank_accounts"],
    });
    if (!farmer) {
      throw new NotFoundException(`Farmer with user ID ${userId} not found`);
    }
    return this.getFarmerWithUser(farmer);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async findNearbyFarmers(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<(Farmer & { user: Partial<User> })[]> {
    try {
      if (!lat || !lng || !radiusKm) {
        throw new BadRequestException(
          "Invalid parameters: latitude, longitude and radius are required",
        );
      }

      const maxRadius = Number(
        await this.systemConfigService.getValue(SystemConfigKey.MAX_GEOSPATIAL_RADIUS_KM),
      ) || 100;

      if (radiusKm <= 0 || radiusKm > maxRadius) {
        throw new BadRequestException(
          `Radius must be between 0 and ${maxRadius} kilometers`,
        );
      }

      // First find all farms with valid locations
      const farms = await this.farmRepository.find({
        where: {
          location: Not(IsNull()),
        },
      });

      console.log('All farms with locations:', farms);

      // Filter farms within radius
      const farmsWithinRadius = farms.filter(farm => {
        try {
          if (!farm.location || (!farm.location.includes(',') && !farm.location.includes('-'))) {
            console.log('Invalid location format for farm:', farm.id);
            return false;
          }

          const [farmLatStr, farmLngStr] = farm.location.includes(',') 
            ? farm.location.split(',')
            : farm.location.split('-');
          const farmLat = parseFloat(farmLatStr);
          const farmLng = parseFloat(farmLngStr);

          if (isNaN(farmLat) || isNaN(farmLng)) {
            console.log('Invalid coordinates for farm:', farm.id);
            return false;
          }

          if (farmLat < -90 || farmLat > 90 || farmLng < -180 || farmLng > 180) {
            console.log('Coordinates out of range for farm:', farm.id);
            return false;
          }

          const distance = this.calculateDistance(lat, lng, farmLat, farmLng);
          const isWithinRadius = distance <= radiusKm;
          
          console.log('Farm coordinates:', { farmLat, farmLng, distance, isWithinRadius });
          return isWithinRadius;
        } catch (error) {
          console.error('Error processing farm location:', farm.id, error);
          return false;
        }
      });

      console.log('Farms within radius:', farmsWithinRadius);

      if (!farmsWithinRadius.length) {
        return [];
      }

      // Get farmers with these farms
      const farmerIds = [...new Set(farmsWithinRadius.map(farm => farm.farmer_id))];
      
      const farmers = await this.farmerRepository.find({
        where: {
          id: In(farmerIds),
        },
      });

      // Get user details separately
      const userIds = farmers.map(farmer => farmer.user_id);
      const users = await this.userRepository.find({
        where: {
          id: In(userIds),
        },
        select: ["id", "email", "avatar_url", "name", "status"],
      });

      // Map users to farmers
      const userMap = new Map(users.map(user => [user.id, user]));
      const farmersWithUsers = farmers.map(farmer => ({
        ...farmer,
        user: userMap.get(farmer.user_id),
      }));

      console.log('Found farmers with users:', farmersWithUsers);

      return farmersWithUsers;
    } catch (error) {
      console.error('Error in findNearbyFarmers:', error);
      throw error;
    }
  }

  async createBankAccount(
    createBankAccountDto: CreateBankAccountDto,
  ): Promise<BankAccount> {
    const bankAccount = this.bankAccountRepository.create(createBankAccountDto);
    return this.bankAccountRepository.save(bankAccount);
  }

  async findBankAccount(id: string): Promise<BankAccount> {
    const bankAccount = await this.bankAccountRepository.findOne({
      where: { id },
    });
    if (!bankAccount) {
      throw new NotFoundException(`Bank account with ID ${id} not found`);
    }
    return bankAccount;
  }

  async updateBankAccount(
    id: string,
    updateBankAccountDto: UpdateBankAccountDto,
  ): Promise<BankAccount> {
    const bankAccount = await this.findBankAccount(id);
    Object.assign(bankAccount, updateBankAccountDto);
    return this.bankAccountRepository.save(bankAccount);
  }

  async addBankAccount(
    farmerId: string,
    bankData: CreateBankAccountDto,
  ): Promise<BankAccount> {
    const farmer = await this.findOne(farmerId);
    const bankAccount = this.bankAccountRepository.create({
      ...bankData,
      farmer_id: farmer.id,
    });
    return this.bankAccountRepository.save(bankAccount);
  }

  async createFarm(createFarmDto: CreateFarmDto): Promise<Farm> {
    const farm = this.farmRepository.create(createFarmDto);
    return this.farmRepository.save(farm);
  }

  async addFarm(farmerId: string, farmData: CreateFarmDto): Promise<Farm> {
    const farmer = await this.findOne(farmerId);
    const farm = this.farmRepository.create({
      ...farmData,
      farmer_id: farmer.id,
    });
    return this.farmRepository.save(farm);
  }

  async updateFarm(id: string, updateFarmDto: UpdateFarmDto): Promise<Farm> {
    const farm = await this.findFarm(id);
    if (!farm) {
      throw new NotFoundException(`Farm with ID ${id} not found`);
    }
    Object.assign(farm, updateFarmDto);
    return this.farmRepository.save(farm);
  }

  async findFarm(id: string): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: { id },
    });
    if (!farm) {
      throw new NotFoundException(`Farm with ID ${id} not found`);
    }
    return farm;
  }

  async getFarmerByOfferAndBuyer(
    offerId: string,
    buyerId: string,
  ): Promise<Farmer & { user: Partial<User> }> {
    const offer = await this.offerRepository.findOne({
      where: {
        id: offerId,
        buyer_id: buyerId,
      },
    });

    if (!offer) {
      throw new NotFoundException(
        `Offer with ID ${offerId} not found for buyer ${buyerId}`,
      );
    }

    const farmer = await this.farmerRepository.findOne({
      where: { user_id: offer.farmer_id },
      relations: ["farms", "bank_accounts"],
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer not found for offer ${offerId}`);
    }

    return this.getFarmerWithUser(farmer);
  }

  async updateUserDetails(
    userId: string,
    updateUserDetailsDto: UpdateUserDetailsDto,
  ): Promise<Farmer & { user: Partial<User> }> {
    // First check if the user exists and is a farmer
    const farmer = await this.findByUserId(userId);

    // Update user details
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Only update the fields that are provided
    Object.assign(user, updateUserDetailsDto);

    // Save the updated user
    await this.userRepository.save(user);

    // Return the updated farmer with user details
    return this.getFarmerWithUser(farmer);
  }
}
