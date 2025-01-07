import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspector } from './entities/inspector.entity';
import { CreateInspectorDto } from './dto/create-inspector.dto';
import { UpdateInspectorDto } from './dto/update-inspector.dto';

@Injectable()
export class InspectorsService {
  constructor(
    @InjectRepository(Inspector)
    private readonly inspectorRepository: Repository<Inspector>,
  ) {}

  async create(createInspectorDto: CreateInspectorDto): Promise<Inspector> {
    const inspector = this.inspectorRepository.create(createInspectorDto);
    return this.inspectorRepository.save(inspector);
  }

  async findAll(): Promise<Inspector[]> {
    return this.inspectorRepository.find();
  }

  async findOne(id: string): Promise<Inspector> {
    const inspector = await this.inspectorRepository.findOne({
      where: { id },
    });
    if (!inspector) {
      throw new NotFoundException(`Inspector with ID ${id} not found`);
    }
    return inspector;
  }

  async findNearby(lat: number, lng: number, radiusKm: number): Promise<Inspector[]> {
    // TODO: Implement geospatial query using PostGIS
    // For now, return all inspectors
    return this.inspectorRepository.find();
  }

  async update(id: string, updateInspectorDto: UpdateInspectorDto): Promise<Inspector> {
    const inspector = await this.findOne(id);
    Object.assign(inspector, updateInspectorDto);
    return this.inspectorRepository.save(inspector);
  }

  async remove(id: string): Promise<void> {
    const inspector = await this.findOne(id);
    await this.inspectorRepository.remove(inspector);
  }
} 