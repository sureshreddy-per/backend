import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produce } from './entities/produce.entity';
import { ProduceFilterDto } from './dto/produce-filter.dto';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { ProduceStatus } from './enums/produce-status.enum';

@Injectable()
export class ProduceService {
  constructor(
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
  ) {}

  async create(createProduceDto: CreateProduceDto): Promise<Produce> {
    const produce = this.produceRepository.create({
      ...createProduceDto,
      status: ProduceStatus.PENDING,
      location: {
        lat: createProduceDto.location.latitude,
        lng: createProduceDto.location.longitude,
      },
      latitude: createProduceDto.location.latitude,
      longitude: createProduceDto.location.longitude,
      pricePerUnit: createProduceDto.price / createProduceDto.quantity,
    });

    return this.produceRepository.save(produce);
  }

  async update(id: string, updateProduceDto: UpdateProduceDto): Promise<Produce> {
    const produce = await this.findOne(id);

    if (produce.status !== ProduceStatus.PENDING && produce.status !== ProduceStatus.AVAILABLE) {
      throw new ForbiddenException('Cannot update produce that is not in PENDING or AVAILABLE status');
    }

    // Update location if provided
    if (updateProduceDto.location) {
      produce.location = {
        lat: updateProduceDto.location.latitude,
        lng: updateProduceDto.location.longitude,
      };
      produce.latitude = updateProduceDto.location.latitude;
      produce.longitude = updateProduceDto.location.longitude;
    }

    // Update price per unit if price or quantity is updated
    if (updateProduceDto.price !== undefined || updateProduceDto.quantity !== undefined) {
      const newPrice = updateProduceDto.price ?? produce.price;
      const newQuantity = updateProduceDto.quantity ?? produce.quantity;
      produce.pricePerUnit = newPrice / newQuantity;
    }

    Object.assign(produce, updateProduceDto);
    return this.produceRepository.save(produce);
  }

  async remove(id: string): Promise<void> {
    const produce = await this.findOne(id);

    if (produce.status !== ProduceStatus.PENDING && produce.status !== ProduceStatus.AVAILABLE) {
      throw new ForbiddenException('Cannot delete produce that is not in PENDING or AVAILABLE status');
    }

    await this.produceRepository.remove(produce);
  }

  async findAll(filters: ProduceFilterDto) {
    const query = this.produceRepository.createQueryBuilder('produce')
      .leftJoinAndSelect('produce.farmer', 'farmer')
      .leftJoinAndSelect('produce.qualityAssessment', 'quality');

    // Apply type filter
    if (filters.type) {
      query.andWhere('produce.type = :type', { type: filters.type });
    }

    // Apply price range filter
    if (filters.minPrice !== undefined) {
      query.andWhere('produce.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters.maxPrice !== undefined) {
      query.andWhere('produce.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    // Apply quality grade filter
    if (filters.grade) {
      query.andWhere('quality.grade = :grade', { grade: filters.grade });
    }

    // Apply quantity range filter
    if (filters.minQuantity !== undefined) {
      query.andWhere('produce.quantity >= :minQuantity', { minQuantity: filters.minQuantity });
    }
    if (filters.maxQuantity !== undefined) {
      query.andWhere('produce.quantity <= :maxQuantity', { maxQuantity: filters.maxQuantity });
    }

    // Apply farmer filter
    if (filters.farmerId) {
      query.andWhere('farmer.id = :farmerId', { farmerId: filters.farmerId });
    }

    // Apply location-based filter
    if (filters.location && filters.radius) {
      const [lat, lng] = filters.location.split(',').map(Number);
      // Using Haversine formula for distance calculation
      query.addSelect(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(produce.latitude)) *
            cos(radians(produce.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(produce.latitude))
          )
        )`,
        'distance'
      )
      .having('distance <= :radius')
      .setParameters({ lat, lng, radius: filters.radius });
    }

    // Apply search term filter
    if (filters.searchTerm) {
      query.andWhere(
        '(LOWER(produce.description) LIKE LOWER(:search) OR LOWER(farmer.name) LIKE LOWER(:search))',
        { search: `%${filters.searchTerm}%` }
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      const order = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
      switch (filters.sortBy) {
        case 'price':
          query.orderBy('produce.price', order);
          break;
        case 'date':
          query.orderBy('produce.createdAt', order);
          break;
        case 'quantity':
          query.orderBy('produce.quantity', order);
          break;
        case 'distance':
          if (filters.location) {
            query.orderBy('distance', order);
          }
          break;
        default:
          query.orderBy('produce.createdAt', 'DESC');
      }
    } else {
      // Default sorting by creation date
      query.orderBy('produce.createdAt', 'DESC');
    }

    // Execute query with pagination
    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      hasMore: items.length < total
    };
  }

  async findOne(id: string): Promise<Produce> {
    const produce = await this.produceRepository.findOne({
      where: { id },
      relations: ['farmer', 'qualityAssessment', 'transactions', 'offers']
    });

    if (!produce) {
      throw new NotFoundException(`Produce with ID "${id}" not found`);
    }

    return produce;
  }

  async findNearby(lat: number, lng: number, radiusInKm: number = 100): Promise<Produce[]> {
    const query = this.produceRepository
      .createQueryBuilder('produce')
      .leftJoinAndSelect('produce.farmer', 'farmer')
      .leftJoinAndSelect('produce.qualityAssessment', 'quality');

    // Add Haversine formula to calculate distance
    query.addSelect(
      `(
        6371 * acos(
          cos(radians(:lat)) * cos(radians(produce.latitude)) *
          cos(radians(produce.longitude) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(produce.latitude))
        )
      )`,
      'distance'
    )
    .having('distance <= :radius')
    .setParameters({ lat, lng, radius: radiusInKm })
    .orderBy('distance', 'ASC');

    return query.getMany();
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
} 