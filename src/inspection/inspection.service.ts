import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspection, InspectionStatus, InspectionMethod, InspectionMetadata } from './entities/inspection.entity';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Quality } from '../quality/entities/quality.entity';
import { Produce } from '../produce/entities/produce.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(Inspection)
    private readonly inspectionRepository: Repository<Inspection>,
    @InjectRepository(Quality)
    private readonly qualityRepository: Repository<Quality>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createInspectionDto: CreateInspectionDto): Promise<Inspection> {
    const metadata: InspectionMetadata = {
      deviceInfo: {
        type: createInspectionDto.deviceInfo.type,
        model: createInspectionDto.deviceInfo.model,
        os: createInspectionDto.deviceInfo.os,
      },
      environmentalFactors: createInspectionDto.environmentalFactors,
      imageAnalysis: createInspectionDto.imageAnalysis,
    };

    const newInspection = this.inspectionRepository.create({
      ...createInspectionDto,
      status: InspectionStatus.PENDING,
      metadata,
    });

    const savedInspection = await this.inspectionRepository.save(newInspection);

    if (savedInspection.method === InspectionMethod.AI) {
      await this.performAiAnalysis(savedInspection.id);
    }

    this.eventEmitter.emit('inspection.created', {
      inspectionId: savedInspection.id,
      produceId: savedInspection.produceId,
      method: savedInspection.method,
    });

    return savedInspection;
  }

  async findAll() {
    return this.inspectionRepository.find({
      relations: ['produce', 'inspector', 'quality'],
    });
  }

  async findOne(id: string): Promise<Inspection> {
    const inspection = await this.inspectionRepository.findOne({
      where: { id },
      relations: ['produce', 'inspector', 'quality'],
    });

    if (!inspection) {
      throw new NotFoundException(`Inspection with ID ${id} not found`);
    }

    return inspection;
  }

  async update(id: string, updateInspectionDto: UpdateInspectionDto): Promise<Inspection> {
    const inspection = await this.findOne(id);
    const updatedInspection = await this.inspectionRepository.save({
      ...inspection,
      ...updateInspectionDto,
      metadata: {
        ...inspection.metadata,
        deviceInfo: updateInspectionDto.deviceInfo ? {
          type: updateInspectionDto.deviceInfo.type,
          model: updateInspectionDto.deviceInfo.model,
          os: updateInspectionDto.deviceInfo.os,
        } : inspection.metadata.deviceInfo,
        environmentalFactors: updateInspectionDto.environmentalFactors || inspection.metadata.environmentalFactors,
        imageAnalysis: updateInspectionDto.imageAnalysis || inspection.metadata.imageAnalysis,
      },
    });

    this.eventEmitter.emit('inspection.updated', {
      inspectionId: updatedInspection.id,
      produceId: updatedInspection.produceId,
      status: updatedInspection.status,
      qualityId: updatedInspection.qualityId,
    });

    return updatedInspection;
  }

  async remove(id: string): Promise<void> {
    const inspection = await this.findOne(id);
    await this.inspectionRepository.remove(inspection);

    this.eventEmitter.emit('inspection.deleted', {
      inspectionId: id,
      produceId: inspection.produceId,
    });
  }

  private async performAiAnalysis(inspectionId: string): Promise<void> {
    const inspection = await this.findOne(inspectionId);
    const imageUrls = inspection.metadata?.imageAnalysis?.imageUrls || [];

    if (!imageUrls.length) {
      throw new Error('No images provided for analysis');
    }

    try {
      // AI analysis logic would go here
      // For now, we'll just update the status
      await this.inspectionRepository.save({
        ...inspection,
        status: InspectionStatus.COMPLETED,
        completedAt: new Date(),
      });

      this.eventEmitter.emit('inspection.ai.completed', {
        inspectionId: inspection.id,
        produceId: inspection.produceId,
      });
    } catch (error) {
      await this.inspectionRepository.save({
        ...inspection,
        status: InspectionStatus.FAILED,
      });

      this.eventEmitter.emit('inspection.ai.failed', {
        inspectionId: inspection.id,
        produceId: inspection.produceId,
        error: error.message,
      });

      throw error;
    }
  }
} 