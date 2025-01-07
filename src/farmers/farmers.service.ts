import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farmer } from './entities/farmer.entity';
import { Farm } from './entities/farm.entity';
import { BankAccount } from './entities/bank-account.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(Farmer)
    private farmersRepository: Repository<Farmer>,
    @InjectRepository(Farm)
    private farmsRepository: Repository<Farm>,
    @InjectRepository(BankAccount)
    private bankAccountsRepository: Repository<BankAccount>,
    private usersService: UsersService,
  ) {}

  async createFarmer(userId: string): Promise<Farmer> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingFarmer = await this.farmersRepository.findOne({
      where: { user_id: userId },
    });
    if (existingFarmer) {
      throw new ConflictException('Farmer profile already exists');
    }

    const farmer = this.farmersRepository.create({ user_id: userId });
    return this.farmersRepository.save(farmer);
  }

  async findAll(): Promise<Farmer[]> {
    return this.farmersRepository.find({
      relations: ['user', 'farms', 'bank_accounts'],
    });
  }

  async findOne(id: string): Promise<Farmer> {
    const farmer = await this.farmersRepository.findOne({
      where: { id },
      relations: ['user', 'farms', 'bank_accounts'],
    });
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }
    return farmer;
  }

  async findByUserId(userId: string): Promise<Farmer> {
    const farmer = await this.farmersRepository.findOne({
      where: { user_id: userId },
      relations: ['user', 'farms', 'bank_accounts'],
    });
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }
    return farmer;
  }

  // Farm management
  async addFarm(farmerId: string, farmData: Partial<Farm>): Promise<Farm> {
    const farmer = await this.findOne(farmerId);
    const farm = this.farmsRepository.create({
      ...farmData,
      farmer_id: farmer.id,
    });
    return this.farmsRepository.save(farm);
  }

  async updateFarm(farmId: string, farmData: Partial<Farm>): Promise<Farm> {
    const farm = await this.farmsRepository.findOne({
      where: { id: farmId },
    });
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }
    await this.farmsRepository.update(farmId, farmData);
    return this.farmsRepository.findOne({
      where: { id: farmId },
    });
  }

  async removeFarm(farmId: string): Promise<void> {
    const farm = await this.farmsRepository.findOne({
      where: { id: farmId },
    });
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }
    await this.farmsRepository.remove(farm);
  }

  // Bank account management
  async addBankAccount(farmerId: string, bankData: Partial<BankAccount>): Promise<BankAccount> {
    const farmer = await this.findOne(farmerId);
    
    if (bankData.is_primary) {
      // Set all other accounts to non-primary
      await this.bankAccountsRepository.update(
        { farmer_id: farmer.id },
        { is_primary: false },
      );
    }

    const bankAccount = this.bankAccountsRepository.create({
      ...bankData,
      farmer_id: farmer.id,
    });
    return this.bankAccountsRepository.save(bankAccount);
  }

  async updateBankAccount(accountId: string, bankData: Partial<BankAccount>): Promise<BankAccount> {
    const account = await this.bankAccountsRepository.findOne({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    if (bankData.is_primary) {
      // Set all other accounts to non-primary
      await this.bankAccountsRepository.update(
        { farmer_id: account.farmer_id },
        { is_primary: false },
      );
    }

    await this.bankAccountsRepository.update(accountId, bankData);
    return this.bankAccountsRepository.findOne({
      where: { id: accountId },
    });
  }

  async removeBankAccount(accountId: string): Promise<void> {
    const account = await this.bankAccountsRepository.findOne({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }
    await this.bankAccountsRepository.remove(account);
  }

  async findNearbyFarmers(lat: number, lng: number, radiusKm: number = 50): Promise<Farmer[]> {
    // TODO: Implement geospatial search using farms' lat_lng field
    return this.farmersRepository.find({
      relations: ['farms'],
    });
  }
} 