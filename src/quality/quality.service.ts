import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityAssessment, InspectionMethod } from './entities/quality-assessment.entity';
import { QualityGrade } from '../produce/enums/quality-grade.enum';
import { CreateQualityAssessmentDto } from './dto/create-quality-assessment.dto';

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(QualityAssessment)
    private readonly qualityAssessmentRepository: Repository<QualityAssessment>,
  ) {}

  async create(createQualityDto: CreateQualityAssessmentDto): Promise<QualityAssessment> {
    const assessment = new QualityAssessment();
    assessment.produce_id = createQualityDto.produce_id;
    assessment.grade = createQualityDto.grade as QualityGrade;
    assessment.inspector_id = createQualityDto.inspector_id;
    assessment.notes = createQualityDto.notes;
    assessment.method = createQualityDto.method as InspectionMethod;
    assessment.imageUrls = createQualityDto.images;
    
    return this.qualityAssessmentRepository.save(assessment);
  }

  async findAll(page = 1, limit = 10): Promise<any> {
    const [items, total] = await this.qualityAssessmentRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['produce', 'inspector'],
      order: { created_at: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<QualityAssessment> {
    const assessment = await this.qualityAssessmentRepository.findOne({
      where: { id },
      relations: ['produce', 'inspector'],
    });

    if (!assessment) {
      throw new NotFoundException(`Quality assessment with ID ${id} not found`);
    }

    return assessment;
  }

  // New inspection-related methods
  async findByInspector(inspectorId: string) {
    return this.qualityAssessmentRepository.find({
      where: { inspector_id: inspectorId },
      relations: ['produce'],
      order: { created_at: 'DESC' },
    });
  }

  async findPendingInspections() {
    return this.qualityAssessmentRepository.find({
      where: { grade: QualityGrade.PENDING },
      relations: ['produce', 'inspector'],
      order: { created_at: 'ASC' },
    });
  }

  async assignInspector(assessmentId: string, inspectorId: string) {
    const assessment = await this.findOne(assessmentId);
    assessment.inspector_id = inspectorId;
    return this.qualityAssessmentRepository.save(assessment);
  }

  async updateAssessmentMethod(assessmentId: string, method: InspectionMethod) {
    const assessment = await this.findOne(assessmentId);
    assessment.method = method;
    return this.qualityAssessmentRepository.save(assessment);
  }

  async completeAssessment(
    id: string,
    grade: QualityGrade,
    notes?: string,
    imageUrls?: string[],
  ): Promise<QualityAssessment> {
    const assessment = await this.findOne(id);
    if (!assessment) {
      throw new NotFoundException(`Quality assessment with ID ${id} not found`);
    }

    assessment.grade = grade;
    if (notes) {
      assessment.notes = notes;
    }
    if (imageUrls?.length) {
      assessment.imageUrls = imageUrls;
    }
    assessment.completedAt = new Date();

    return this.qualityAssessmentRepository.save(assessment);
  }
} 