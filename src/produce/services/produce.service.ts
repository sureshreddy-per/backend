import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, FindManyOptions } from 'typeorm';
import { Produce } from '../entities/produce.entity';
import { ProduceStatus } from '../enums/produce-status.enum';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { ProduceSynonymService } from '../services/synonym.service';
import { CreateProduceDto } from '../dto/create-produce.dto';

@Injectable()
export class ProduceService {
  constructor(
    @InjectRepository(Produce)
    protected readonly produceRepository: Repository<Produce>,
    private readonly synonymService: ProduceSynonymService
  ) {}

  async findByPriceRange(maxPrice: number): Promise<PaginatedResponse<Produce>> {
    const [items, total] = await this.produceRepository.findAndCount({
      where: {
        price_per_unit: LessThanOrEqual(maxPrice),
        status: ProduceStatus.AVAILABLE
      }
    });

    return {
      items,
      total,
      page: 1,
      limit: 10,
      totalPages: Math.ceil(total / 10)
    };
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

  async findById(id: string): Promise<Produce | null> {
    return this.produceRepository.findOne({ where: { id } });
  }

  async findNearby(lat: number, lon: number, radius: number = 100): Promise<Produce[]> {
    // Using Haversine formula directly in PostgreSQL for better performance
    return this.produceRepository
      .createQueryBuilder('produce')
      .where('produce.status = :status', { status: ProduceStatus.AVAILABLE })
      .andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(CAST(split_part(produce.location, ',', 1) AS float))) *
            cos(radians(CAST(split_part(produce.location, ',', 2) AS float)) - radians(:lon)) +
            sin(radians(:lat)) * sin(radians(CAST(split_part(produce.location, ',', 1) AS float)))
          )
        ) <= :radius`,
        { lat, lon, radius }
      )
      .orderBy(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(CAST(split_part(produce.location, ',', 1) AS float))) *
            cos(radians(CAST(split_part(produce.location, ',', 2) AS float)) - radians(:lon)) +
            sin(radians(:lat)) * sin(radians(CAST(split_part(produce.location, ',', 1) AS float)))
          )
        )`,
        'ASC'
      )
      .getMany();
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  async deleteById(id: string): Promise<void> {
    await this.produceRepository.delete(id);
  }

  async handleProduceNameSynonyms(name: string, language: string): Promise<string> {
    try {
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
    } catch (error) {
      // If there's an error handling synonyms, just return the original name
      return name;
    }
  }

  async create(createProduceDto: CreateProduceDto): Promise<Produce> {
    try {
      // Handle produce name synonyms
      const canonicalName = await this.handleProduceNameSynonyms(
        createProduceDto.name,
        createProduceDto.language || 'en'
      );

      // Create the produce entity
      const produce = this.produceRepository.create({
        ...createProduceDto,
        name: canonicalName,
        status: ProduceStatus.AVAILABLE
      });

      // Save and return the produce
      return this.produceRepository.save(produce);
    } catch (error) {
      // If there's an error with synonyms, create produce with original name
      const produce = this.produceRepository.create({
        ...createProduceDto,
        status: ProduceStatus.AVAILABLE
      });
      return this.produceRepository.save(produce);
    }
  }

  async update(id: string, data: Partial<Produce>): Promise<Produce> {
    await this.produceRepository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException(`Produce with ID ${id} not found`);
    }
    return updated;
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

  async count(): Promise<number> {
    return this.produceRepository.count();
  }

  async countByStatus(status: ProduceStatus): Promise<number> {
    return this.produceRepository.count({ where: { status } });
  }

  async updateStatus(id: string, status: ProduceStatus): Promise<Produce> {
    const produce = await this.findOne(id);
    produce.status = status;
    return this.produceRepository.save(produce);
  }

  async assignInspector(id: string, inspector_id: string): Promise<Produce> {
    const produce = await this.findOne(id);
    produce.assigned_inspector = inspector_id;
    produce.status = ProduceStatus.PENDING_INSPECTION;
    return this.produceRepository.save(produce);
  }

  async getStats() {
    const [
      totalProduce,
      availableProduce,
      pendingInspection,
      rejected,
      sold,
      cancelled
    ] = await Promise.all([
      this.count(),
      this.countByStatus(ProduceStatus.AVAILABLE),
      this.countByStatus(ProduceStatus.PENDING_INSPECTION),
      this.countByStatus(ProduceStatus.REJECTED),
      this.countByStatus(ProduceStatus.SOLD),
      this.countByStatus(ProduceStatus.CANCELLED)
    ]);

    return {
      total: totalProduce,
      available: availableProduce,
      pending_inspection: pendingInspection,
      rejected,
      sold,
      cancelled
    };
  }
}