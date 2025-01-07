import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farmer } from './entities/farmer.entity';
import { Farm } from './entities/farm.entity';
import { BankAccount } from './entities/bank-account.entity';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(Farmer)
    private readonly farmerRepository: Repository<Farmer>,
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
  ) {}

  async createFarmer(userId: string): Promise<Farmer> {
    const farmer = this.farmerRepository.create({
      user_id: userId,
    });
    return this.farmerRepository.save(farmer);
  }

  async findOne(id: string): Promise<Farmer> {
    const farmer = await this.farmerRepository.findOne({
      where: { id },
      relations: ['farms', 'bank_accounts'],
    });
    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${id} not found`);
    }
    return farmer;
  }

  async findByUserId(userId: string): Promise<Farmer> {
    const farmer = await this.farmerRepository.findOne({
      where: { user_id: userId },
      relations: ['farms', 'bank_accounts'],
    });
    if (!farmer) {
      throw new NotFoundException(`Farmer with user ID ${userId} not found`);
    }
    return farmer;
  }

  async findNearbyFarmers(lat: number, lng: number, radiusKm: number): Promise<Farmer[]> {
    // TODO: Implement geospatial query
    return this.farmerRepository.find();
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
    const farm = await this.farmRepository.findOne({
      where: { id },
    });
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
} 