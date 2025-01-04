import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produce, ProduceStatus, VerifiedStatus } from './entities/produce.entity';
import { User } from '../auth/entities/user.entity';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProduceService {
  constructor(
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createProduceDto: CreateProduceDto, userId: string): Promise<Produce> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isFarmer) {
      throw new BadRequestException('Only farmers can create produce listings');
    }

    // Create a new produce instance with the provided data
    const produce = new Produce();
    Object.assign(produce, {
      ...createProduceDto,
      farmerId: userId,
      status: ProduceStatus.PENDING,
      verifiedStatus: VerifiedStatus.NONE,
    });

    // Save the produce instance
    const savedProduce = await this.produceRepository.save(produce);

    // Emit produce created event
    this.eventEmitter.emit('produce.created', {
      produceId: savedProduce.id,
      farmerId: savedProduce.farmerId,
      type: savedProduce.type,
    });

    return savedProduce;
  }

  async findAll(page = 1, limit = 10, filters?: {
    type?: string;
    status?: ProduceStatus;
    verifiedStatus?: VerifiedStatus;
    minQuantity?: number;
    maxQuantity?: number;
    location?: { lat: number; lng: number; radius: number };
  }) {
    const query = this.produceRepository.createQueryBuilder('produce')
      .leftJoinAndSelect('produce.user', 'user')
      .leftJoinAndSelect('produce.quality', 'quality');

    if (filters) {
      if (filters.type) {
        query.andWhere('produce.type = :type', { type: filters.type });
      }
      if (filters.status) {
        query.andWhere('produce.status = :status', { status: filters.status });
      }
      if (filters.verifiedStatus) {
        query.andWhere('produce.verifiedStatus = :verifiedStatus', { verifiedStatus: filters.verifiedStatus });
      }
      if (filters.minQuantity) {
        query.andWhere('produce.quantity >= :minQuantity', { minQuantity: filters.minQuantity });
      }
      if (filters.maxQuantity) {
        query.andWhere('produce.quantity <= :maxQuantity', { maxQuantity: filters.maxQuantity });
      }
      if (filters.location) {
        query.andWhere(
          'ST_DWithin(ST_SetSRID(ST_MakePoint(produce.lng, produce.lat), 4326)::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
          {
            lat: filters.location.lat,
            lng: filters.location.lng,
            radius: filters.location.radius * 1000, // Convert km to meters
          }
        );
      }
    }

    const [produces, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('produce.createdAt', 'DESC')
      .getManyAndCount();

    return {
      produces,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Produce> {
    const produce = await this.produceRepository.findOne({
      where: { id },
      relations: ['user', 'quality'],
    });

    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    return produce;
  }

  async update(id: string, updateProduceDto: UpdateProduceDto, userId: string): Promise<Produce> {
    const produce = await this.findOne(id);

    if (produce.farmerId !== userId) {
      throw new BadRequestException('You can only update your own produce listings');
    }

    if (produce.status !== ProduceStatus.PENDING) {
      throw new BadRequestException('Can only update pending produce listings');
    }

    // Update the produce instance with the new data
    Object.assign(produce, updateProduceDto);
    
    // Save the updated produce
    const savedProduce = await this.produceRepository.save(produce);

    // Emit produce updated event
    this.eventEmitter.emit('produce.updated', {
      produceId: savedProduce.id,
      farmerId: savedProduce.farmerId,
      type: savedProduce.type,
    });

    return savedProduce;
  }

  async updateStatus(id: string, status: ProduceStatus, userId: string): Promise<Produce> {
    const produce = await this.findOne(id);

    if (produce.farmerId !== userId) {
      throw new BadRequestException('You can only update your own produce listings');
    }

    // Update the status
    produce.status = status;
    
    // Save the updated produce
    const savedProduce = await this.produceRepository.save(produce);

    // Emit produce status updated event
    this.eventEmitter.emit('produce.status.updated', {
      produceId: savedProduce.id,
      farmerId: savedProduce.farmerId,
      status: savedProduce.status,
    });

    return savedProduce;
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const [produces, total] = await this.produceRepository.findAndCount({
      where: { farmerId: userId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['quality'],
      order: { createdAt: 'DESC' },
    });

    return {
      produces,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateQualityGrade(id: string, qualityId: string, verifiedStatus: VerifiedStatus, userId: string): Promise<Produce> {
    const produce = await this.findOne(id);
    
    // Get the user to check their role
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only allow admins and quality inspectors to update quality grades
    if (!user.isAdmin && !user.isQualityInspector) {
      throw new ForbiddenException('Only admins and quality inspectors can update quality grades');
    }

    // Update the quality grade
    produce.qualityId = qualityId;
    produce.verifiedStatus = verifiedStatus;
    produce.status = ProduceStatus.ASSESSED;

    // Save the updated produce
    const savedProduce = await this.produceRepository.save(produce);

    // Emit produce quality updated event
    this.eventEmitter.emit('produce.quality.updated', {
      produceId: savedProduce.id,
      farmerId: savedProduce.farmerId,
      qualityId: savedProduce.qualityId,
      verifiedStatus: savedProduce.verifiedStatus,
      updatedBy: userId,
    });

    return savedProduce;
  }
} 