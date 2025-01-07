import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityAssessment } from './entities/quality-assessment.entity';
import { QualityGrade } from '../produce/enums/quality-grade.enum';

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(QualityAssessment)
    private readonly qualityAssessmentRepository: Repository<QualityAssessment>,
  ) {}

  async create(createQualityDto: any): Promise<QualityAssessment> {
    const assessment = new QualityAssessment();
    assessment.produce_id = createQualityDto.produce_id;
    assessment.grade = createQualityDto.grade as QualityGrade;
    assessment.inspector_id = createQualityDto.inspector_id;
    assessment.notes = createQualityDto.notes;
    
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
} 