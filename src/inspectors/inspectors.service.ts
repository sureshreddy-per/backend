import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspector } from './entities/inspector.entity';

@Injectable()
export class InspectorsService {
  constructor(
    @InjectRepository(Inspector)
    private inspectorsRepository: Repository<Inspector>,
  ) {}

  async create(createInspectorDto: Partial<Inspector>): Promise<Inspector> {
    const inspector = this.inspectorsRepository.create(createInspectorDto);
    return this.inspectorsRepository.save(inspector);
  }

  async findAll(): Promise<Inspector[]> {
    return this.inspectorsRepository.find();
  }

  async findOne(id: string): Promise<Inspector> {
    return this.inspectorsRepository.findOneBy({ id });
  }

  async update(id: string, updateInspectorDto: Partial<Inspector>): Promise<Inspector> {
    await this.inspectorsRepository.update(id, updateInspectorDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.inspectorsRepository.delete(id);
  }

  async findNearby(lat: number, lng: number, radiusKm: number): Promise<Inspector[]> {
    // TODO: Implement geospatial search using lat_lng field
    return this.inspectorsRepository.find();
  }
} 