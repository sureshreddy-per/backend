import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farmer } from './entities/farmer.entity';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { ProduceHistoryQueryDto, ProduceHistoryResponseDto } from './dto/produce-history.dto';

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(Farmer)
    private readonly farmerRepository: Repository<Farmer>
  ) {}

  async create(createFarmerDto: CreateFarmerDto) {
    const farmer = new Farmer();
    Object.assign(farmer, {
      ...createFarmerDto,
      rating: 0,
      totalRatings: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
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
          rating: transaction.buyer.rating
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
} 