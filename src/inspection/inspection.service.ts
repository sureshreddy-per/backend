import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspection, InspectionStatus } from './entities/inspection.entity';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(Inspection)
    private readonly inspectionRepository: Repository<Inspection>,
  ) {}

  async create(createInspectionDto: CreateInspectionDto) {
    const inspection = this.inspectionRepository.create({
      ...createInspectionDto,
      status: InspectionStatus.PENDING,
    });
    return this.inspectionRepository.save(inspection);
  }

  async findAll() {
    const [items, total] = await this.inspectionRepository.findAndCount({
      relations: ['produce', 'inspector', 'quality'],
    });
    return {
      items,
      meta: {
        total,
      },
    };
  }

  async findOne(id: string) {
    const inspection = await this.inspectionRepository.findOne({
      where: { id },
      relations: ['produce', 'inspector', 'quality'],
    });

    if (!inspection) {
      throw new NotFoundException('Inspection not found');
    }

    return inspection;
  }

  async update(id: string, updateInspectionDto: UpdateInspectionDto) {
    const inspection = await this.findOne(id);
    Object.assign(inspection, updateInspectionDto);
    return this.inspectionRepository.save(inspection);
  }

  async remove(id: string) {
    const inspection = await this.findOne(id);
    await this.inspectionRepository.remove(inspection);
    return { success: true };
  }

  async findByInspector(inspectorId: string) {
    return this.inspectionRepository.find({
      where: { inspectorId },
      relations: ['produce'],
      order: { createdAt: 'DESC' },
    });
  }
}