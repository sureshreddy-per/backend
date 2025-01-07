import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produce, ProduceCategory, ProduceStatus } from './entities/produce.entity';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { LessThanOrEqual } from 'typeorm';

interface FindAllOptions {
  farmer_id?: string;
  farm_id?: string;
  status?: ProduceStatus;
  produce_category?: ProduceCategory;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProduceService {
  constructor(
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
  ) {}

  async create(createProduceDto: CreateProduceDto): Promise<Produce> {
    const produce = this.produceRepository.create(createProduceDto);
    return this.produceRepository.save(produce);
  }

  async findAll(options: FindAllOptions = {}): Promise<PaginatedResponse<Produce>> {
    const {
      farmer_id,
      farm_id,
      status,
      produce_category,
      page = 1,
      limit = 10,
    } = options;

    const query = this.produceRepository.createQueryBuilder('produce');

    if (farmer_id) {
      query.andWhere('produce.farmer_id = :farmer_id', { farmer_id });
    }

    if (farm_id) {
      query.andWhere('produce.farm_id = :farm_id', { farm_id });
    }

    if (status) {
      query.andWhere('produce.status = :status', { status });
    }

    if (produce_category) {
      query.andWhere('produce.produce_category = :produce_category', { produce_category });
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Produce> {
    const produce = await this.produceRepository.findOne({
      where: { id },
      relations: ['farmer', 'farm', 'quality_assessments'],
    });

    if (!produce) {
      throw new NotFoundException(`Produce with ID ${id} not found`);
    }

    return produce;
  }

  async findNearby(lat: number, lon: number, radius: number): Promise<Produce[]> {
    // Using PostGIS ST_DWithin to find produce within radius (in kilometers)
    return this.produceRepository
      .createQueryBuilder('produce')
      .where(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(produce.longitude, produce.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
          :radius * 1000
        )`,
        { lat, lon, radius }
      )
      .andWhere('produce.status = :status', { status: ProduceStatus.AVAILABLE })
      .orderBy(
        `ST_Distance(
          ST_SetSRID(ST_MakePoint(produce.longitude, produce.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
        )`,
        'ASC'
      )
      .getMany();
  }

  async update(id: string, updateProduceDto: UpdateProduceDto): Promise<Produce> {
    const produce = await this.findOne(id);
    Object.assign(produce, updateProduceDto);
    return this.produceRepository.save(produce);
  }

  async remove(id: string): Promise<void> {
    const produce = await this.findOne(id);
    await this.produceRepository.remove(produce);
  }

  async findByPriceRange(maxPrice: number): Promise<Produce[]> {
    return this.produceRepository.find({
      where: {
        price_per_unit: LessThanOrEqual(maxPrice),
        status: ProduceStatus.AVAILABLE
      }
    });
  }
} 