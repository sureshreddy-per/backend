import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProduceMaster } from '../entities/produce-master.entity';

@Injectable()
export class ProduceMasterService {
  private readonly logger = new Logger(ProduceMasterService.name);

  constructor(
    @InjectRepository(ProduceMaster)
    private readonly produceMasterRepository: Repository<ProduceMaster>,
  ) {}

  async findAll(options: {
    isActive?: boolean;
    category?: string;
    subCategory?: string;
    search?: string;
  } = {}): Promise<ProduceMaster[]> {
    const query = this.produceMasterRepository.createQueryBuilder('produce_master');

    // Apply filters
    if (options.isActive !== undefined) {
      query.andWhere('produce_master.is_active = :isActive', { isActive: options.isActive });
    }

    if (options.category) {
      query.andWhere('produce_master.category = :category', { category: options.category });
    }

    if (options.subCategory) {
      query.andWhere('produce_master.sub_category = :subCategory', { subCategory: options.subCategory });
    }

    if (options.search) {
      query.andWhere(
        '(LOWER(produce_master.name) LIKE LOWER(:search) OR LOWER(produce_master.description) LIKE LOWER(:search))',
        { search: `%${options.search}%` }
      );
    }

    // Order by name
    query.orderBy('produce_master.name', 'ASC');

    return query.getMany();
  }

  async findOne(id: string): Promise<ProduceMaster> {
    return this.produceMasterRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<ProduceMaster> {
    return this.produceMasterRepository.findOne({
      where: { name: name.toLowerCase() }
    });
  }

  async create(data: Partial<ProduceMaster>): Promise<ProduceMaster> {
    // Ensure name is lowercase
    if (data.name) {
      data.name = data.name.toLowerCase();
    }

    const produceMaster = this.produceMasterRepository.create(data);
    return this.produceMasterRepository.save(produceMaster);
  }

  async update(id: string, data: Partial<ProduceMaster>): Promise<ProduceMaster> {
    // Ensure name is lowercase if provided
    if (data.name) {
      data.name = data.name.toLowerCase();
    }

    await this.produceMasterRepository.update(id, data);
    return this.findOne(id);
  }

  async getCategories(): Promise<{ category: string; subCategories: string[] }[]> {
    const result = await this.produceMasterRepository
      .createQueryBuilder('produce_master')
      .select('category')
      .addSelect('array_agg(DISTINCT sub_category) as subCategories')
      .where('category IS NOT NULL')
      .groupBy('category')
      .getRawMany();

    return result.map(item => ({
      category: item.category,
      subCategories: item.subcategories.filter(Boolean) // Remove null values
    }));
  }

  async deactivate(id: string): Promise<void> {
    await this.produceMasterRepository.update(id, { isActive: false });
  }

  async activate(id: string): Promise<void> {
    await this.produceMasterRepository.update(id, { isActive: true });
  }
} 