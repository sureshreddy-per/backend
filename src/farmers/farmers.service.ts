import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farmer } from './entities/farmer.entity';
import { Farm } from './entities/farm.entity';
import { BankAccount } from './entities/bank-account.entity';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { UpdateUserDetailsDto } from './dto/update-user-details.dto';
import { User } from '../users/entities/user.entity';
import { Offer } from '../offers/entities/offer.entity';

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
  ) {}

  private async getFarmerWithUser(farmer: Farmer): Promise<Farmer & { user: Partial<User> }> {
    const user = await this.userRepository.findOne({
      where: { id: farmer.user_id },
      select: ['id', 'email', 'avatar_url', 'name', 'status']
    });

    if (!user) {
      throw new NotFoundException(`User details for farmer ${farmer.id} not found`);
    }

    return { ...farmer, user };
  }

  async createFarmer(userId: string): Promise<Farmer & { user: Partial<User> }> {
    const farmer = this.farmerRepository.create({
      user_id: userId,
    });
    const savedFarmer = await this.farmerRepository.save(farmer);
    return this.getFarmerWithUser(savedFarmer);
  }

  async findOne(id: string): Promise<Farmer & { user: Partial<User> }> {
    const farmer = await this.farmerRepository.findOne({
      where: { id },
      relations: ['farms', 'bank_accounts'],
    });
    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${id} not found`);
    }
    return this.getFarmerWithUser(farmer);
  }

  async findByUserId(userId: string): Promise<Farmer & { user: Partial<User> }> {
    const farmer = await this.farmerRepository.findOne({
      where: { user_id: userId },
      relations: ['farms', 'bank_accounts'],
    });
    if (!farmer) {
      throw new NotFoundException(`Farmer with user ID ${userId} not found`);
    }
    return this.getFarmerWithUser(farmer);
  }

  async findNearbyFarmers(lat: number, lng: number, radiusKm: number): Promise<(Farmer & { user: Partial<User> })[]> {
    // TODO: Implement geospatial query
    const farmers = await this.farmerRepository.find();
    return Promise.all(farmers.map(farmer => this.getFarmerWithUser(farmer)));
  }

  async createBankAccount(createBankAccountDto: CreateBankAccountDto): Promise<BankAccount> {
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

  async updateBankAccount(id: string, updateBankAccountDto: UpdateBankAccountDto): Promise<BankAccount> {
    const bankAccount = await this.findBankAccount(id);
    Object.assign(bankAccount, updateBankAccountDto);
    return this.bankAccountRepository.save(bankAccount);
  }

  async addBankAccount(farmerId: string, bankData: CreateBankAccountDto): Promise<BankAccount> {
    const farmer = await this.findOne(farmerId);
    const bankAccount = this.bankAccountRepository.create({
      ...bankData,
      farmer_id: farmer.id
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
      farmer_id: farmer.id
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

  async getFarmerByOfferAndBuyer(offerId: string, buyerId: string): Promise<Farmer & { user: Partial<User> }> {
    const offer = await this.offerRepository.findOne({
      where: {
        id: offerId,
        buyer_id: buyerId
      }
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found for buyer ${buyerId}`);
    }

    const farmer = await this.farmerRepository.findOne({
      where: { user_id: offer.farmer_id },
      relations: ['farms', 'bank_accounts'],
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer not found for offer ${offerId}`);
    }

    return this.getFarmerWithUser(farmer);
  }

  async updateUserDetails(userId: string, updateUserDetailsDto: UpdateUserDetailsDto): Promise<Farmer & { user: Partial<User> }> {
    // First check if the user exists and is a farmer
    const farmer = await this.findByUserId(userId);

    // Update user details
    const user = await this.userRepository.findOne({
      where: { id: userId }
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