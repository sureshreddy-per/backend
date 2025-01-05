import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Farmer } from './entities/farmer.entity';
import { BankDetails } from './entities/bank-details.entity';
import { FarmDetails } from './entities/farm-details.entity';
import { Produce } from '../produce/entities/produce.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { CreateFarmDetailsDto } from './dto/farm-details.dto';
import { UpdateFarmDetailsDto } from './dto/farm-details.dto';
import { ProduceHistoryQueryDto, ProduceHistoryResponseDto } from './dto/produce-history.dto';

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(Farmer)
    private readonly farmerRepository: Repository<Farmer>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(BankDetails)
    private readonly bankDetailsRepository: Repository<BankDetails>,
    @InjectRepository(FarmDetails)
    private readonly farmDetailsRepository: Repository<FarmDetails>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>
  ) {}

  async create(createFarmerDto: CreateFarmerDto) {
    // Check if farmer already exists for this user
    const existingFarmer = await this.farmerRepository.findOne({
      where: { userId: createFarmerDto.userId }
    });

    if (existingFarmer) {
      throw new BadRequestException('Farmer profile already exists for this user');
    }

    const farmer = new Farmer();
    Object.assign(farmer, {
      userId: createFarmerDto.userId,
      rating: 0,
      totalRatings: 0
    });

    const savedFarmer = await this.farmerRepository.save(farmer);

    // Handle bank details if provided
    if (createFarmerDto.bankDetails) {
      const bankDetails = new BankDetails();
      Object.assign(bankDetails, {
        ...createFarmerDto.bankDetails,
        farmerId: savedFarmer.id,
        isPrimary: true // First bank account is primary
      });
      await this.bankDetailsRepository.save(bankDetails);
    }

    // Handle farm details if provided
    if (createFarmerDto.farms && createFarmerDto.farms.length > 0) {
      for (const farmData of createFarmerDto.farms) {
        const farmDetails = new FarmDetails();
        Object.assign(farmDetails, {
          ...farmData,
          farmerId: savedFarmer.id
        });
        await this.farmDetailsRepository.save(farmDetails);
      }
    }

    return this.findOne(savedFarmer.id);
  }

  async createFromUser(user: any) {
    // Check if farmer already exists for this user
    const existingFarmer = await this.farmerRepository.findOne({
      where: { userId: user.id }
    });

    if (existingFarmer) {
      return existingFarmer;
    }

    const farmer = new Farmer();
    Object.assign(farmer, {
      userId: user.id,
      rating: 0,
      totalRatings: 0
    });

    return this.farmerRepository.save(farmer);
  }

  async findAll() {
    const farmers = await this.farmerRepository.find({
      relations: ['produce', 'farms']
    });

    return farmers.map(farmer => {
      farmer.produceCount = farmer.produce?.length || 0;
      return farmer;
    });
  }

  async findOne(id: string) {
    const farmer = await this.farmerRepository.findOne({
      where: { id },
      relations: ['produce', 'farms']
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${id} not found`);
    }

    farmer.produceCount = farmer.produce?.length || 0;
    return farmer;
  }

  async update(id: string, updateFarmerDto: UpdateFarmerDto) {
    const farmer = await this.findOne(id);
    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${id} not found`);
    }

    // Handle farm details update
    if (updateFarmerDto.farms) {
      // Remove existing farm details
      await this.farmDetailsRepository.delete({ farmerId: id });

      // Add new farm details
      for (const farmData of updateFarmerDto.farms) {
        const farmDetails = new FarmDetails();
        Object.assign(farmDetails, {
          ...farmData,
          farmerId: id
        });
        await this.farmDetailsRepository.save(farmDetails);
      }
    }

    // Handle bank details update
    if (updateFarmerDto.bankDetails) {
      const existingBankDetails = await this.bankDetailsRepository.findOne({
        where: { farmerId: id }
      });

      if (existingBankDetails) {
        // Update existing bank details
        Object.assign(existingBankDetails, updateFarmerDto.bankDetails);
        await this.bankDetailsRepository.save(existingBankDetails);
      } else {
        // Create new bank details
        const bankDetails = new BankDetails();
        Object.assign(bankDetails, {
          ...updateFarmerDto.bankDetails,
          farmerId: id,
          isPrimary: true
        });
        await this.bankDetailsRepository.save(bankDetails);
      }
    }

    return this.farmerRepository.save(farmer);
  }

  async addBankAccount(farmerId: string, bankDetails: Partial<BankDetails>) {
    const farmer = await this.findOne(farmerId);
    if (!farmer) {
      throw new NotFoundException(`Farmer not found`);
    }

    // Check if account number already exists for this farmer
    const existingAccount = await this.bankDetailsRepository.findOne({
      where: { farmerId, accountNumber: bankDetails.accountNumber }
    });

    if (existingAccount) {
      throw new BadRequestException('Bank account with this number already exists');
    }

    const newBankDetails = this.bankDetailsRepository.create({
      ...bankDetails,
      farmerId,
      isPrimary: !(await this.bankDetailsRepository.findOne({ where: { farmerId } }))
    });

    return this.bankDetailsRepository.save(newBankDetails);
  }

  async setPrimaryBankAccount(farmerId: string, bankDetailsId: string) {
    const bankDetails = await this.bankDetailsRepository.findOne({
      where: { id: bankDetailsId, farmerId }
    });

    if (!bankDetails) {
      throw new NotFoundException('Bank account not found or does not belong to farmer');
    }

    // Reset all bank accounts to non-primary
    await this.bankDetailsRepository.update(
      { farmerId },
      { isPrimary: false }
    );

    // Set the selected account as primary
    bankDetails.isPrimary = true;
    return this.bankDetailsRepository.save(bankDetails);
  }

  async deleteBankAccount(farmerId: string, bankDetailsId: string) {
    const bankDetails = await this.bankDetailsRepository.findOne({
      where: { id: bankDetailsId, farmerId }
    });

    if (!bankDetails) {
      throw new NotFoundException('Bank account not found or does not belong to farmer');
    }

    // Don't allow deleting the last primary account
    if (bankDetails.isPrimary) {
      const otherAccounts = await this.bankDetailsRepository.count({ 
        where: { farmerId, id: Not(bankDetailsId) }
      });

      if (otherAccounts === 0) {
        throw new BadRequestException('Cannot delete the only bank account. Add another account first.');
      }

      // Make another account primary
      const nextBankDetails = await this.bankDetailsRepository.findOne({
        where: { farmerId, id: Not(bankDetailsId) }
      });

      if (nextBankDetails) {
        nextBankDetails.isPrimary = true;
        await this.bankDetailsRepository.save(nextBankDetails);
      }
    }

    await this.bankDetailsRepository.remove(bankDetails);
    return { message: 'Bank account deleted successfully' };
  }

  async getProduceHistory(
    farmerId: string,
    query: ProduceHistoryQueryDto
  ): Promise<ProduceHistoryResponseDto> {
    const farmer = await this.farmerRepository.findOne({
      where: { id: farmerId },
      relations: ['produce', 'produce.transactions', 'produce.transactions.buyer']
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${farmerId} not found`);
    }

    const transactions = farmer.produce
      .flatMap(produce => produce.transactions)
      .filter(transaction => {
        if (query.startDate && new Date(transaction.createdAt) < new Date(query.startDate)) {
          return false;
        }
        if (query.endDate && new Date(transaction.createdAt) > new Date(query.endDate)) {
          return false;
        }
        return true;
      })
      .map(transaction => ({
        id: transaction.id,
        quantity: transaction.quantity,
        pricePerUnit: transaction.pricePerUnit,
        status: transaction.status,
        createdAt: transaction.createdAt,
        buyer: {
          id: transaction.buyer.id,
          name: transaction.buyer.name,
          rating: transaction.buyer.metadata?.ratings?.average || 0
        }
      }));

    const totalValue = transactions.reduce(
      (sum, t) => sum + t.quantity * t.pricePerUnit,
      0
    );

    return {
      transactions,
      meta: {
        total: transactions.length,
        totalValue,
        averagePrice: transactions.length > 0 ? totalValue / transactions.length : 0
      }
    };
  }

  async getBuyerHistory(farmerId: string): Promise<any[]> {
    const transactions = await this.transactionRepository.find({
      where: { farmerId },
      relations: ['buyer'],
    });

    return transactions.map(transaction => ({
      buyerId: transaction.buyer.id,
      name: transaction.buyer.name,
      rating: transaction.buyer.metadata?.ratings?.average || 0,
      transactionCount: 1,
      lastTransactionDate: transaction.createdAt,
    }));
  }

  async findNearby(lat: number, lng: number, radius: number = 10): Promise<any[]> {
    // Using Haversine formula to calculate distance
    const haversineFormula = `
      111.045 * DEGREES(ACOS(
        COS(RADIANS(:lat)) * COS(RADIANS(CAST(farm.location->>'lat' AS FLOAT))) *
        COS(RADIANS(:lng) - RADIANS(CAST(farm.location->>'lng' AS FLOAT))) +
        SIN(RADIANS(:lat)) * SIN(RADIANS(CAST(farm.location->>'lat' AS FLOAT)))
      ))
    `;

    const query = this.farmerRepository
      .createQueryBuilder('farmer')
      .leftJoinAndSelect('farmer.farms', 'farm')
      .leftJoinAndSelect('farmer.produce', 'produce')
      .addSelect(`${haversineFormula}`, 'distance')
      .where(`${haversineFormula} <= :radius`, { lat, lng, radius })
      .orderBy('distance', 'ASC')
      .setParameters({ lat, lng, radius });

    const rawResults = await query.getRawAndEntities();
    
    // Group results by farmer and find minimum distance
    const farmerMap = new Map();
    rawResults.raw.forEach((raw: any) => {
      const farmerId = raw.farmer_id;
      const distance = parseFloat(raw.distance);
      
      if (!farmerMap.has(farmerId) || distance < farmerMap.get(farmerId).distance) {
        farmerMap.set(farmerId, { distance });
      }
    });

    // Combine farmer entities with their minimum distances
    return rawResults.entities.map(farmer => {
      const farmerData = farmerMap.get(farmer.id);
      return {
        ...farmer,
        distance: farmerData?.distance || null,
        produceCount: farmer.produce?.length || 0
      };
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async findByUserId(userId: string): Promise<Farmer> {
    const farmer = await this.farmerRepository.findOne({
      where: { userId },
      relations: ['produce', 'farms', 'bankAccounts']
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer not found for user ${userId}`);
    }

    farmer.produceCount = farmer.produce?.length || 0;
    return farmer;
  }

  async addFarm(farmerId: string, createFarmDetailsDto: CreateFarmDetailsDto) {
    const farmer = await this.farmerRepository.findOne({
      where: { id: farmerId }
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${farmerId} not found`);
    }

    const farmDetails = this.farmDetailsRepository.create({
      ...createFarmDetailsDto,
      farmerId
    });

    return this.farmDetailsRepository.save(farmDetails);
  }

  async getFarms(farmerId: string) {
    const farms = await this.farmDetailsRepository.find({
      where: { farmerId },
      order: { createdAt: 'DESC' }
    });

    return farms;
  }

  async getFarmById(farmerId: string, farmId: string) {
    const farm = await this.farmDetailsRepository.findOne({
      where: { id: farmId, farmerId }
    });

    if (!farm) {
      throw new NotFoundException(`Farm not found or does not belong to farmer ${farmerId}`);
    }

    return farm;
  }

  async updateFarm(farmerId: string, farmId: string, updateFarmDetailsDto: UpdateFarmDetailsDto) {
    const farm = await this.getFarmById(farmerId, farmId);
    
    Object.assign(farm, updateFarmDetailsDto);
    
    return this.farmDetailsRepository.save(farm);
  }

  async deleteFarm(farmerId: string, farmId: string) {
    const farm = await this.getFarmById(farmerId, farmId);

    // Check if farm has any produce
    const hasProduceCount = await this.produceRepository.count({
      where: { farmId }
    });

    if (hasProduceCount > 0) {
      throw new BadRequestException('Cannot delete farm that has produce listings');
    }

    await this.farmDetailsRepository.remove(farm);
    return { message: 'Farm deleted successfully' };
  }

  async getFarmProduce(farmerId: string, farmId: string) {
    const farm = await this.getFarmById(farmerId, farmId);

    const produce = await this.produceRepository.find({
      where: { farmId: farm.id },
      order: { createdAt: 'DESC' }
    });

    return produce;
  }
} 