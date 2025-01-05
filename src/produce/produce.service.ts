import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produce } from './entities/produce.entity';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { ProduceFilterDto } from './dto/produce-filter.dto';
import { Farmer } from '../farmers/entities/farmer.entity';

@Injectable()
export class ProduceService {
  constructor(
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @InjectRepository(Farmer)
    private readonly farmerRepository: Repository<Farmer>,
  ) {}

  async getFarmerByUserId(userId: string): Promise<Farmer> {
    const farmer = await this.farmerRepository.findOne({
      where: { userId }
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    return farmer;
  }

  async create(farmerId: string, createProduceDto: CreateProduceDto) {
    const produce = this.produceRepository.create({
      ...createProduceDto,
      farmerId,
      location: {
        lat: createProduceDto.location.latitude,
        lng: createProduceDto.location.longitude
      }
    });
    return this.produceRepository.save(produce);
  }

  async findAll(filters?: ProduceFilterDto) {
    if (!filters) {
      return this.produceRepository.find();
    }

    const query = this.produceRepository.createQueryBuilder('produce')
      .leftJoinAndSelect('produce.farmer', 'farmer');

    if (filters.type) {
      query.andWhere('produce.type = :type', { type: filters.type });
    }

    if (filters.minPrice) {
      query.andWhere('produce.pricePerUnit >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice) {
      query.andWhere('produce.pricePerUnit <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters.location) {
      // Add location-based filtering using PostGIS
      query.andWhere(
        'ST_DWithin(ST_SetSRID(ST_MakePoint(farmer.location->>"lng", farmer.location->>"lat"), 4326)::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
        {
          lng: filters.location.longitude,
          lat: filters.location.latitude,
          radius: (filters.radius || 10) * 1000 // Convert km to meters
        }
      );
    }

    const [items, total] = await query
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();

    return {
      items,
      total,
      hasMore: total > filters.page * filters.limit
    };
  }

  async findByFarmerId(farmerId: string) {
    return this.produceRepository.find({
      where: { farmerId },
      relations: ['farmer']
    });
  }

  async findOne(id: string): Promise<Produce> {
    const produce = await this.produceRepository.findOne({ 
      where: { id },
      relations: ['farmer']
    });
    if (!produce) {
      throw new NotFoundException(`Produce with ID "${id}" not found`);
    }
    return produce;
  }

  async update(id: string, farmerId: string, updateProduceDto: UpdateProduceDto) {
    const produce = await this.findOne(id);

    if (produce.farmerId !== farmerId) {
      throw new ForbiddenException('You can only update your own produce listings');
    }

    Object.assign(produce, updateProduceDto);
    return this.produceRepository.save(produce);
  }

  async remove(id: string, farmerId: string) {
    const produce = await this.findOne(id);

    if (produce.farmerId !== farmerId) {
      throw new ForbiddenException('You can only delete your own produce listings');
    }

    await this.produceRepository.remove(produce);
    return { id };
  }

  async findNearby(params: {
    latitude: number;
    longitude: number;
    radiusInKm: number;
    limit?: number;
  }): Promise<Produce[]> {
    const { latitude, longitude, radiusInKm, limit = 10 } = params;
    
    // Using Haversine formula in raw SQL for PostgreSQL
    const query = this.produceRepository.createQueryBuilder('produce')
      .where(`
        ST_DistanceSphere(
          ST_MakePoint(produce.location->>'lng', produce.location->>'lat')::geometry,
          ST_MakePoint(:longitude, :latitude)::geometry
        ) <= :radius
      `, {
        latitude,
        longitude,
        radius: radiusInKm * 1000 // Convert km to meters
      })
      .orderBy(`
        ST_DistanceSphere(
          ST_MakePoint(produce.location->>'lng', produce.location->>'lat')::geometry,
          ST_MakePoint(:longitude, :latitude)::geometry
        )
      `)
      .limit(limit);

    return query.getMany();
  }
} 