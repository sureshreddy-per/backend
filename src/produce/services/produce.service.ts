import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Produce } from '../entities/produce.entity';
import { CreateProduceDto } from '../dto/create-produce.dto';
import { ProduceStatus } from '../enums/produce-status.enum';
import { OnEvent } from '@nestjs/event-emitter';
import { QualityAssessmentCompletedEvent } from '../../quality/events/quality-assessment-completed.event';

@Injectable()
export class ProduceService {
  private readonly logger = new Logger(ProduceService.name);

  constructor(
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
  ) {}

  @OnEvent('quality.assessment.completed')
  async handleQualityAssessmentCompleted(event: QualityAssessmentCompletedEvent) {
    const produce = await this.findOne(event.produce_id);
    
    // Update produce with AI assessment results
    produce.quality_grade = event.quality_grade;
    produce.status = ProduceStatus.AVAILABLE;
    
    // If confidence level is too low, mark for manual inspection
    if (event.confidence_level < 80) {
      produce.status = ProduceStatus.PENDING_INSPECTION;
      this.logger.log(`Produce ${produce.id} marked for manual inspection due to low AI confidence`);
    }
    
    await this.produceRepository.save(produce);
    this.logger.log(`Updated produce ${produce.id} status after quality assessment`);
  }

  @OnEvent('quality.assessment.failed')
  async handleQualityAssessmentFailed(event: { produce_id: string; error: string }) {
    const produce = await this.findOne(event.produce_id);
    
    // Update produce status to indicate assessment failure
    produce.status = ProduceStatus.ASSESSMENT_FAILED;
    await this.produceRepository.save(produce);
    
    this.logger.error(`Quality assessment failed for produce ${produce.id}: ${event.error}`);
  }

  async create(createProduceDto: CreateProduceDto & { farmer_id: string }): Promise<Produce> {
    if (!createProduceDto.farmer_id) {
      throw new BadRequestException('farmer_id is required');
    }

    const produce = this.produceRepository.create({
      ...createProduceDto,
      status: ProduceStatus.PENDING_AI_ASSESSMENT,
    });

    try {
      return await this.produceRepository.save(produce);
    } catch (error) {
      this.logger.error(`Failed to create produce: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create produce. Please check all required fields.');
    }
  }

  async findAll(filters: any = {}): Promise<Produce[]> {
    return this.produceRepository.find({
      where: filters,
      relations: ['farmer'],
    });
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

  async findByFarmer(farmerId: string): Promise<Produce[]> {
    return this.produceRepository.find({
      where: { farmer_id: farmerId },
      relations: ['farmer'],
    });
  }

  async findAvailableInRadius(latitude: number, longitude: number, radiusInKm: number): Promise<Produce[]> {
    // Simple distance calculation using latitude and longitude
    const produces = await this.produceRepository.find({
      where: { status: ProduceStatus.AVAILABLE },
      relations: ['farmer'],
    });

    // Filter produces within radius using Haversine formula
    return produces.filter(produce => {
      const [produceLat, produceLong] = produce.location.split(',').map(Number);
      const R = 6371; // Earth's radius in kilometers
      const dLat = this.toRad(produceLat - latitude);
      const dLon = this.toRad(produceLong - longitude);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.toRad(latitude)) * Math.cos(this.toRad(produceLat)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance <= radiusInKm;
    });
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  async findAndPaginate(options: any): Promise<any> {
    const [items, total] = await this.produceRepository.findAndCount(options);
    return {
      items,
      total,
      page: options.page || 1,
      limit: options.take || 10,
      totalPages: Math.ceil(total / (options.take || 10)),
    };
  }

  async updateStatus(id: string, status: ProduceStatus): Promise<Produce> {
    const produce = await this.findOne(id);
    produce.status = status;
    return this.produceRepository.save(produce);
  }

  async assignInspector(id: string, inspector_id: string): Promise<Produce> {
    const produce = await this.findOne(id);
    produce.assigned_inspector = inspector_id;
    return this.produceRepository.save(produce);
  }

  async count(): Promise<number> {
    return this.produceRepository.count();
  }

  async countByStatus(status: ProduceStatus): Promise<number> {
    return this.produceRepository.count({ where: { status } });
  }

  async getStats() {
    const [total, available, pending] = await Promise.all([
      this.count(),
      this.countByStatus(ProduceStatus.AVAILABLE),
      this.countByStatus(ProduceStatus.PENDING_AI_ASSESSMENT),
    ]);

    return {
      total,
      available,
      pending,
      utilization_rate: total > 0 ? (available / total) * 100 : 0,
    };
  }

  async findByIds(ids: string[]): Promise<Produce[]> {
    return this.produceRepository.find({
      where: { id: In(ids) },
      relations: ['farmer'],
    });
  }

  async findNearby(latitude: number, longitude: number, radiusInKm: number): Promise<Produce[]> {
    return this.findAvailableInRadius(latitude, longitude, radiusInKm);
  }

  async findById(id: string): Promise<Produce> {
    return this.findOne(id);
  }

  async update(id: string, updateData: any): Promise<Produce> {
    const produce = await this.findOne(id);
    Object.assign(produce, updateData);
    return this.produceRepository.save(produce);
  }

  async deleteById(id: string): Promise<{ message: string }> {
    const produce = await this.findOne(id);
    await this.produceRepository.remove(produce);
    return { message: 'Produce deleted successfully' };
  }
}
