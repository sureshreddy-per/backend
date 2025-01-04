import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produce } from './entities/produce.entity';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { QualityGrade } from './enums/quality-grade.enum';
import { ProduceStatus } from './enums/produce-status.enum';

@Injectable()
export class ProduceService {
  constructor(
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>
  ) {}

  async create(createProduceDto: CreateProduceDto) {
    const produce = new Produce();
    Object.assign(produce, {
      ...createProduceDto,
      status: ProduceStatus.PENDING,
      qualityGrade: QualityGrade.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return this.produceRepository.save(produce);
  }

  async findAll(page = 1, limit = 10) {
    const [items, total] = await this.produceRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['farmer']
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        hasNext: total > page * limit
      }
    };
  }

  async findOne(id: string) {
    return this.produceRepository.findOne({
      where: { id },
      relations: ['farmer']
    });
  }

  async update(id: string, updateProduceDto: UpdateProduceDto) {
    const produce = await this.findOne(id);
    if (!produce) return null;

    Object.assign(produce, {
      ...updateProduceDto,
      updatedAt: new Date()
    });

    return this.produceRepository.save(produce);
  }

  async remove(id: string) {
    const produce = await this.findOne(id);
    if (produce) {
      await this.produceRepository.remove(produce);
    }
  }

  async findNearby(lat: number, lng: number, radiusInKm: number) {
    // Using Haversine formula to calculate distance
    const earthRadiusKm = 6371;
    const query = this.produceRepository
      .createQueryBuilder('produce')
      .where('produce.status = :status', { status: ProduceStatus.AVAILABLE })
      .andWhere(`
        ${earthRadiusKm} * 2 * ASIN(SQRT(
          POWER(SIN((:lat - produce.location->>'lat') * PI() / 180 / 2), 2) +
          COS(:lat * PI() / 180) * COS((produce.location->>'lat') * PI() / 180) *
          POWER(SIN((:lng - produce.location->>'lng') * PI() / 180 / 2), 2)
        )) <= :radius
      `)
      .setParameters({ lat, lng, radius: radiusInKm })
      .orderBy(
        `${earthRadiusKm} * 2 * ASIN(SQRT(
          POWER(SIN((:lat - produce.location->>'lat') * PI() / 180 / 2), 2) +
          COS(:lat * PI() / 180) * COS((produce.location->>'lat') * PI() / 180) *
          POWER(SIN((:lng - produce.location->>'lng') * PI() / 180 / 2), 2)
        ))`,
        'ASC'
      );

    return query.getMany();
  }
} 