import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { QualityAssessment } from '../entities/quality-assessment.entity';
import { Produce } from '../../produce/entities/produce.entity';
import { CreateQualityAssessmentDto } from '../dto/create-quality-assessment.dto';
import { validateRequiredFields } from '../utils/validation.util';

@Injectable()
export class QualityAssessmentService {
  private readonly logger = new Logger(QualityAssessmentService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'quality_assessment:';

  constructor(
    @InjectRepository(QualityAssessment)
    private readonly qualityAssessmentRepository: Repository<QualityAssessment>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(createQualityAssessmentDto: CreateQualityAssessmentDto): Promise<QualityAssessment> {
    try {
      const produce = await this.produceRepository.findOne({
        where: { id: createQualityAssessmentDto.produce_id }
      });

      if (!produce) {
        throw new NotFoundException(`Produce with ID ${createQualityAssessmentDto.produce_id} not found`);
      }

      // Validate required fields based on produce category
      const validationResult = validateRequiredFields(
        produce.produce_category,
        createQualityAssessmentDto.category_specific_assessment
      );

      if (!validationResult.isValid) {
        throw new BadRequestException(
          `Missing required fields for category ${produce.produce_category}: ${validationResult.missingFields.join(', ')}`
        );
      }

      if (createQualityAssessmentDto.quality_grade < 0 || createQualityAssessmentDto.quality_grade > 10) {
        throw new BadRequestException('Quality grade must be between 0 and 10');
      }

      const assessment = new QualityAssessment();
      assessment.produce_id = produce.id;
      assessment.produce_name = produce.name;
      assessment.category = produce.produce_category;
      assessment.quality_grade = createQualityAssessmentDto.quality_grade;
      assessment.confidence_level = createQualityAssessmentDto.confidence_level;
      assessment.defects = createQualityAssessmentDto.defects || [];
      assessment.recommendations = createQualityAssessmentDto.recommendations || [];
      assessment.category_specific_assessment = createQualityAssessmentDto.category_specific_assessment;
      assessment.metadata = createQualityAssessmentDto.metadata || {};

      const savedAssessment = await this.qualityAssessmentRepository.save(assessment);
      
      // Invalidate cache for this produce's assessments
      await this.cacheManager.del(`${this.CACHE_PREFIX}produce:${produce.id}`);
      await this.cacheManager.del(`${this.CACHE_PREFIX}latest:${produce.id}`);
      
      return savedAssessment;
    } catch (error) {
      this.logger.error(`Failed to create quality assessment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByProduceId(produceId: string): Promise<QualityAssessment[]> {
    const cacheKey = `${this.CACHE_PREFIX}produce:${produceId}`;
    const cached = await this.cacheManager.get<QualityAssessment[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const assessments = await this.qualityAssessmentRepository.find({
      where: { produce_id: produceId },
      order: { created_at: 'DESC' }
    });

    await this.cacheManager.set(cacheKey, assessments, this.CACHE_TTL);
    return assessments;
  }

  async findLatestByProduceId(produceId: string): Promise<QualityAssessment> {
    const cacheKey = `${this.CACHE_PREFIX}latest:${produceId}`;
    const cached = await this.cacheManager.get<QualityAssessment>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const assessment = await this.qualityAssessmentRepository.findOne({
      where: { produce_id: produceId },
      order: { created_at: 'DESC' }
    });

    if (!assessment) {
      throw new NotFoundException(`No quality assessment found for produce ${produceId}`);
    }

    await this.cacheManager.set(cacheKey, assessment, this.CACHE_TTL);
    return assessment;
  }

  async findAll(page = 1, limit = 10): Promise<{ items: QualityAssessment[]; total: number }> {
    const [items, total] = await this.qualityAssessmentRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return { items, total };
  }

  async findOne(id: string): Promise<QualityAssessment> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.cacheManager.get<QualityAssessment>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const assessment = await this.qualityAssessmentRepository.findOne({
      where: { id }
    });

    if (!assessment) {
      throw new NotFoundException(`Quality assessment ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, assessment, this.CACHE_TTL);
    return assessment;
  }
}
