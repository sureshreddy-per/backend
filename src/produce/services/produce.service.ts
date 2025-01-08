import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { Produce, ProduceStatus } from '../entities/produce.entity';
import { BaseService } from '../../common/base.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class ProduceService extends BaseService<Produce> {
  constructor(
    @InjectRepository(Produce)
    protected readonly produceRepository: Repository<Produce>
  ) {
    super(produceRepository);
  }

  async findByPriceRange(maxPrice: number): Promise<Produce[]> {
    return super.findAll({
      where: {
        price_per_unit: LessThanOrEqual(maxPrice),
        status: ProduceStatus.AVAILABLE
      }
    });
  }

  async findAndPaginate(options: FindManyOptions<Produce>): Promise<PaginatedResponse<Produce>> {
    const [items, total] = await this.produceRepository.findAndCount(options);
    const { take = 10, skip = 0 } = options;
    const page = Math.floor(skip / take) + 1;
    const totalPages = Math.ceil(total / take);

    return {
      items,
      total,
      page,
      limit: take,
      totalPages
    };
  }

  async findById(id: string): Promise<Produce> {
    return super.findById(id);
  }

  async findNearby(lat: number, lon: number, radius: number = 10): Promise<Produce[]> {
    // This is a simplified version. In a real application, you would use PostGIS or similar
    // to calculate actual distances and find nearby produce
    return this.produceRepository.find({
      where: {
        status: ProduceStatus.AVAILABLE
      }
    });
  }

  async deleteById(id: string): Promise<void> {
    await super.delete(id);
  }
} 