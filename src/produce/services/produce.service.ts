import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { Produce, ProduceStatus } from '../entities/produce.entity';
import { BaseService } from '../../common/base.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { SynonymService } from '../services/synonym.service';
import { CreateProduceDto } from '../dto/create-produce.dto';

@Injectable()
export class ProduceService extends BaseService<Produce> {
  constructor(
    @InjectRepository(Produce)
    protected readonly produceRepository: Repository<Produce>,
    private readonly synonymService: SynonymService
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

  async findNearby(lat: number, lon: number, radius: number = 100): Promise<Produce[]> {
    // Using Haversine formula in PostgreSQL to calculate distance with string location
    return this.produceRepository
      .createQueryBuilder('produce')
      .where('produce.status = :status', { status: ProduceStatus.AVAILABLE })
      .andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(split_part(produce.location, '-', 1)::float)) *
            cos(radians(split_part(produce.location, '-', 2)::float) - radians(:lon)) +
            sin(radians(:lat)) * sin(radians(split_part(produce.location, '-', 1)::float))
          )
        ) <= :radius`,
        { lat, lon, radius }
      )
      .orderBy(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(split_part(produce.location, '-', 1)::float)) *
            cos(radians(split_part(produce.location, '-', 2)::float) - radians(:lon)) +
            sin(radians(:lat)) * sin(radians(split_part(produce.location, '-', 1)::float))
          )
        )`,
        'ASC'
      )
      .getMany();
  }

  async deleteById(id: string): Promise<void> {
    await super.delete(id);
  }

  async handleProduceNameSynonyms(name: string, language: string): Promise<string> {
    // Get canonical name from synonyms
    const canonicalName = await this.synonymService.findCanonicalName(name);

    // Add the current name as a synonym if it's different from canonical
    if (name.toLowerCase() !== canonicalName.toLowerCase()) {
      await this.synonymService.addSynonyms(canonicalName, [name]);
    }

    // If language is provided and different from default (English)
    if (language && language.toLowerCase() !== 'en') {
      // Add the localized name as a synonym
      await this.synonymService.addSynonyms(canonicalName, [name]);
    }

    return canonicalName;
  }

  async create(createProduceDto: CreateProduceDto): Promise<Produce> {
    // Handle produce name synonyms
    const canonicalName = await this.handleProduceNameSynonyms(
      createProduceDto.name,
      createProduceDto.language || 'en'
    );

    // Use canonical name for the produce entry
    const produce = this.produceRepository.create({
      ...createProduceDto,
      name: canonicalName
    });

    return this.produceRepository.save(produce);
  }

  async findOne(id: string): Promise<Produce> {
    const produce = await this.produceRepository.findOne({
      where: { id },
      relations: ['farmer'],
    });

    if (!produce) {
      throw new NotFoundException(`Produce with ID ${id} not found`);
    }

    return produce;
  }
} 