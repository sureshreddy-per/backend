import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farmer } from './entities/farmer.entity';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProduceHistoryQueryDto, ProduceHistoryResponseDto } from './dto/produce-history.dto';

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(Farmer)
    private readonly farmerRepository: Repository<Farmer>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, createFarmerDto: CreateFarmerDto): Promise<Farmer> {
    const newFarmer = this.farmerRepository.create({
      ...createFarmerDto,
      userId,
    });

    const savedFarmer = await this.farmerRepository.save(newFarmer);

    this.eventEmitter.emit('farmer.created', {
      farmerId: savedFarmer.id,
      userId: savedFarmer.userId,
    });

    return savedFarmer;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ items: Farmer[]; total: number }> {
    const [items, total] = await this.farmerRepository.findAndCount({
      relations: ['produces'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total };
  }

  async findOne(id: string): Promise<Farmer> {
    const farmer = await this.farmerRepository.findOne({
      where: { id },
      relations: ['produces', 'produces.transactions', 'produces.transactions.buyer'],
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${id} not found`);
    }

    return farmer;
  }

  async findByUserId(userId: string): Promise<Farmer> {
    const farmer = await this.farmerRepository.findOne({
      where: { userId },
      relations: ['produces', 'produces.transactions', 'produces.transactions.buyer'],
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer with user ID ${userId} not found`);
    }

    return farmer;
  }

  async update(id: string, updateFarmerDto: UpdateFarmerDto): Promise<Farmer> {
    const farmer = await this.findOne(id);
    const updatedFarmer = await this.farmerRepository.save({
      ...farmer,
      ...updateFarmerDto,
    });

    this.eventEmitter.emit('farmer.updated', {
      farmerId: updatedFarmer.id,
      userId: updatedFarmer.userId,
    });

    return updatedFarmer;
  }

  async remove(id: string): Promise<void> {
    const farmer = await this.findOne(id);
    await this.farmerRepository.remove(farmer);

    this.eventEmitter.emit('farmer.deleted', {
      farmerId: id,
      userId: farmer.userId,
    });
  }

  async getProduceHistory(id: string, query: ProduceHistoryQueryDto): Promise<ProduceHistoryResponseDto> {
    const farmer = await this.findOne(id);
    const transactions = farmer.produces
      .flatMap(produce => produce.transactions || [])
      .filter(transaction => {
        if (query.startDate && new Date(transaction.createdAt) < new Date(query.startDate)) {
          return false;
        }
        if (query.endDate && new Date(transaction.createdAt) > new Date(query.endDate)) {
          return false;
        }
        if (query.transactionStatus && transaction.status !== query.transactionStatus) {
          return false;
        }
        if (query.minPrice && transaction.totalCost < query.minPrice) {
          return false;
        }
        if (query.maxPrice && transaction.totalCost > query.maxPrice) {
          return false;
        }
        return true;
      })
      .slice((query.page - 1) * query.limit, query.page * query.limit)
      .map(transaction => ({
        id: transaction.id,
        produceId: transaction.produceId,
        amount: transaction.amount,
        quantity: transaction.quantity,
        unit: transaction.unit,
        totalCost: transaction.totalCost,
        status: transaction.status,
        createdAt: transaction.createdAt,
        buyer: transaction.buyer ? {
          id: transaction.buyer.id,
          name: transaction.buyer.name,
          email: transaction.buyer.email,
          phone: transaction.buyer.phone,
        } : null,
      }));

    return {
      farmerId: farmer.id,
      userId: farmer.userId,
      transactions,
      total: transactions.length,
      page: query.page,
      limit: query.limit,
    };
  }
} 