import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farmer } from './entities/farmer.entity';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { ProduceHistoryQueryDto, ProduceHistoryResponseDto } from './dto/produce-history.dto';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(Farmer)
    private readonly farmerRepository: Repository<Farmer>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>
  ) {}

  async create(createFarmerDto: CreateFarmerDto) {
    const farmer = new Farmer();
    Object.assign(farmer, {
      userId: createFarmerDto.userId,
      name: createFarmerDto.name,
      phoneNumber: createFarmerDto.phoneNumber,
      email: createFarmerDto.email,
      location: createFarmerDto.location,
      farmSize: createFarmerDto.farmDetails?.size ? parseFloat(createFarmerDto.farmDetails.size) : null,
      farmSizeUnit: createFarmerDto.farmDetails?.size ? 'acres' : null,
      rating: 0,
      totalRatings: 0,
      isActive: true
    });

    return this.farmerRepository.save(farmer);
  }

  async createFromUser(user: any) {
    const farmer = new Farmer();
    Object.assign(farmer, {
      userId: user.id,
      name: user.name,
      phoneNumber: user.phone,
      email: user.email,
      rating: 0,
      totalRatings: 0,
      isActive: true
    });

    return this.farmerRepository.save(farmer);
  }

  async findAll() {
    const farmers = await this.farmerRepository.find({
      relations: ['produce']
    });

    return farmers.map(farmer => ({
      ...farmer,
      produceCount: farmer.produce?.length || 0
    }));
  }

  async findOne(id: string) {
    const farmer = await this.farmerRepository.findOne({
      where: { id },
      relations: ['produce']
    });

    return {
      ...farmer,
      produceCount: farmer.produce?.length || 0
    };
  }

  async update(id: string, updateFarmerDto: UpdateFarmerDto) {
    const farmer = await this.findOne(id);
    if (!farmer) return null;

    Object.assign(farmer, {
      ...updateFarmerDto,
      updatedAt: new Date()
    });

    return this.farmerRepository.save(farmer);
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
      return {
        transactions: [],
        meta: {
          total: 0,
          totalValue: 0,
          averagePrice: 0
        }
      };
    }

    const transactions = farmer.produce
      .flatMap(produce => produce.transactions)
      .filter(transaction => {
        if (query.startDate && new Date(transaction.createdAt) < query.startDate) {
          return false;
        }
        if (query.endDate && new Date(transaction.createdAt) > query.endDate) {
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
      transactionCount: 1, // This should be aggregated in a real implementation
      lastTransactionDate: transaction.createdAt,
    }));
  }

  async findNearby(lat: number, lng: number, radius: number = 10): Promise<Farmer[]> {
    // Using Haversine formula to calculate distance
    const haversineFormula = `
      111.045 * DEGREES(ACOS(
        COS(RADIANS($1)) * COS(RADIANS(CAST(location->>'lat' AS FLOAT))) *
        COS(RADIANS($2) - RADIANS(CAST(location->>'lng' AS FLOAT))) +
        SIN(RADIANS($1)) * SIN(RADIANS(CAST(location->>'lat' AS FLOAT)))
      ))
    `;

    const farmers = await this.farmerRepository
      .createQueryBuilder('farmer')
      .where(`${haversineFormula} <= :radius`, { lat, lng, radius })
      .orderBy(haversineFormula, 'ASC')
      .setParameters([lat, lng])
      .getMany();

    return farmers.map(farmer => ({
      ...farmer,
      distance: this.calculateDistance(lat, lng, farmer.location.lat, farmer.location.lng)
    }));
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
      relations: ['produce']
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer not found for user ${userId}`);
    }

    return {
      ...farmer,
      produceCount: farmer.produce?.length || 0
    };
  }
} 