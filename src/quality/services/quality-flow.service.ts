import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityAssessment, AssessmentSource } from '../entities/quality-assessment.entity';
import { ProduceService } from '../../produce/services/produce.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class QualityFlowService {
  private readonly logger = new Logger(QualityFlowService.name);

  constructor(
    @InjectRepository(QualityAssessment)
    private readonly qualityAssessmentRepo: Repository<QualityAssessment>,
    private readonly produceService: ProduceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createAssessment(data: {
    produce_id: string;
    quality_grade: number;
    confidence_level: number;
    defects?: string[];
    recommendations?: string[];
    description?: string;
    category_specific_assessment?: Record<string, any>;
    metadata?: {
      inspector_id?: string;
      inspection_id?: string;
      ai_model_version?: string;
      assessment_parameters?: Record<string, any>;
      images?: string[];
    };
  }): Promise<QualityAssessment> {
    const assessment = this.qualityAssessmentRepo.create({
      ...data,
      source: AssessmentSource.AI
    });

    const savedAssessment = await this.qualityAssessmentRepo.save(assessment);

    this.eventEmitter.emit('quality.assessment.completed', savedAssessment);

    return savedAssessment;
  }

  async updateAssessment(id: string, data: {
    quality_grade: number;
    defects?: string[];
    recommendations?: string[];
    description?: string;
    category_specific_assessment?: Record<string, any>;
    metadata?: {
      inspector_id?: string;
      inspection_id?: string;
      assessment_parameters?: Record<string, any>;
      images?: string[];
    };
  }): Promise<QualityAssessment> {
    const assessment = await this.qualityAssessmentRepo.findOne({ where: { id } });
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    Object.assign(assessment, {
      ...data,
      source: AssessmentSource.MANUAL_INSPECTION
    });

    const savedAssessment = await this.qualityAssessmentRepo.save(assessment);

    this.eventEmitter.emit('quality.assessment.updated', savedAssessment);

    return savedAssessment;
  }

  async findByProduce(produce_id: string): Promise<QualityAssessment[]> {
    return this.qualityAssessmentRepo.find({
      where: { produce_id },
      order: { created_at: 'DESC' }
    });
  }

  async getLatestAssessment(produce_id: string): Promise<QualityAssessment | null> {
    const assessments = await this.qualityAssessmentRepo.find({
      where: { produce_id },
      order: { created_at: 'DESC' },
      take: 1
    });

    return assessments[0] || null;
  }

  async getLatestManualAssessment(produce_id: string): Promise<QualityAssessment | null> {
    const assessments = await this.qualityAssessmentRepo.find({
      where: {
        produce_id,
        source: AssessmentSource.MANUAL_INSPECTION
      },
      order: { created_at: 'DESC' },
      take: 1
    });

    return assessments[0] || null;
  }
}