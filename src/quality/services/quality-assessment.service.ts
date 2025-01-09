import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityAssessment, AssessmentSource } from '../entities/quality-assessment.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { ProduceService } from '../../produce/services/produce.service';

@Injectable()
export class QualityAssessmentService {
  constructor(
    @InjectRepository(QualityAssessment)
    private readonly assessmentRepository: Repository<QualityAssessment>,
    private readonly notificationService: NotificationService,
    private readonly produceService: ProduceService,
  ) {}

  async createFromAI(data: {
    produce_id: string;
    quality_grade: number;
    confidence_level: number;
    defects?: string[];
    recommendations?: string[];
    description?: string;
    category_specific_assessment?: Record<string, any>;
    metadata?: {
      ai_model_version?: string;
      assessment_parameters?: Record<string, any>;
      images?: string[];
    };
  }): Promise<QualityAssessment> {
    const produce = await this.produceService.findOne(data.produce_id);
    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    const assessment = this.assessmentRepository.create({
      ...data,
      source: AssessmentSource.AI,
    });

    const savedAssessment = await this.assessmentRepository.save(assessment);

    await this.notificationService.create({
      user_id: produce.farmer_id,
      type: NotificationType.QUALITY_UPDATE,
      data: {
        produce_id: data.produce_id,
        assessment_id: savedAssessment.id,
        quality_grade: data.quality_grade,
      },
    });

    return savedAssessment;
  }

  async updateFromInspection(
    produce_id: string,
    data: {
      quality_grade: number;
      defects?: string[];
      recommendations?: string[];
      images?: string[];
      notes?: string;
      inspector_id?: string;
      inspection_id?: string;
    },
  ): Promise<QualityAssessment> {
    const produce = await this.produceService.findOne(produce_id);
    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    const assessment = this.assessmentRepository.create({
      produce_id,
      quality_grade: data.quality_grade,
      confidence_level: 100, // Manual inspection has 100% confidence
      defects: data.defects,
      recommendations: data.recommendations,
      description: data.notes,
      source: AssessmentSource.MANUAL_INSPECTION,
      metadata: {
        inspector_id: data.inspector_id,
        inspection_id: data.inspection_id,
        images: data.images,
      },
    });

    const savedAssessment = await this.assessmentRepository.save(assessment);

    await this.notificationService.create({
      user_id: produce.farmer_id,
      type: NotificationType.QUALITY_UPDATE,
      data: {
        produce_id,
        assessment_id: savedAssessment.id,
        quality_grade: data.quality_grade,
        is_manual_inspection: true,
      },
    });

    return savedAssessment;
  }

  async findByProduce(produce_id: string): Promise<QualityAssessment[]> {
    return this.assessmentRepository.find({
      where: { produce_id },
      order: { created_at: 'DESC' },
    });
  }

  async getLatestAssessment(produce_id: string): Promise<QualityAssessment> {
    const assessments = await this.assessmentRepository.find({
      where: { produce_id },
      order: { created_at: 'DESC' },
      take: 1,
    });

    return assessments[0];
  }

  async getLatestManualAssessment(produce_id: string): Promise<QualityAssessment> {
    const assessments = await this.assessmentRepository.find({
      where: {
        produce_id,
        source: AssessmentSource.MANUAL_INSPECTION,
      },
      order: { created_at: 'DESC' },
      take: 1,
    });

    return assessments[0];
  }
}