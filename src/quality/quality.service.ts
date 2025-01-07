import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { QualityAssessment } from './entities/quality-assessment.entity';
import { QualityGrade } from '../produce/enums/quality-grade.enum';
import { CreateQualityDto } from './dto/create-quality.dto';
import { AssessQualityDto } from './dto/assess-quality.dto';
import { ProduceCategory } from '../produce/entities/produce.entity';

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(QualityAssessment)
    private readonly qualityRepository: Repository<QualityAssessment>
  ) {}

  async create(createQualityDto: CreateQualityDto) {
    const quality = new QualityAssessment();
    Object.assign(quality, {
      produce_id: createQualityDto.produceId,
      criteria: createQualityDto.criteria,
      inspector_id: createQualityDto.assessedBy,
      grade: QualityGrade.PENDING,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Check if this is the first assessment for the produce
    const existingAssessments = await this.qualityRepository.find({
      where: { produce_id: createQualityDto.produceId }
    });

    const savedQuality = await this.qualityRepository.save(quality);

    // If this is the first assessment, set it as primary
    if (existingAssessments.length === 0) {
      await this.setPrimaryAssessment(savedQuality.id, savedQuality.produce_id);
    }

    return savedQuality;
  }

  async assess(id: string, assessDto: AssessQualityDto) {
    const quality = await this.findOne(id);
    
    if (quality.assessed_at) {
      throw new BadRequestException('Cannot modify a completed assessment');
    }

    // Update the quality assessment with the new data
    quality.images = assessDto.imageUrls;
    quality.grade = this.calculateQualityGrade(quality);
    quality.assessed_at = new Date();
    quality.updated_at = new Date();

    if (assessDto.metadata) {
      quality.criteria = {
        ...quality.criteria,
        ...assessDto.metadata
      };
    }

    return this.qualityRepository.save(quality);
  }

  async findAll() {
    const [items, total] = await this.qualityRepository.findAndCount({
      relations: ['produce']
    });
    return {
      items,
      meta: {
        total
      }
    };
  }

  async findOne(id: string) {
    const quality = await this.qualityRepository.findOne({
      where: { id },
      relations: ['produce']
    });

    if (!quality) {
      throw new NotFoundException('Quality assessment not found');
    }

    return quality;
  }

  async findByProduce(produceId: string) {
    return this.qualityRepository.find({
      where: { produce_id: produceId },
      order: { created_at: 'DESC' }
    });
  }

  async setPrimaryAssessment(id: string, produceId: string) {
    // Update all assessments for this produce to not be primary
    await this.qualityRepository.update(
      { produce_id: produceId },
      { is_primary: false }
    );

    // Set the specified assessment as primary
    await this.qualityRepository.update(
      { id },
      { is_primary: true }
    );

    return this.findOne(id);
  }

  async remove(id: string) {
    const quality = await this.findOne(id);
    if (!quality) {
      throw new NotFoundException('Quality assessment not found');
    }

    if (quality.assessed_at) {
      throw new BadRequestException('Cannot delete a completed assessment');
    }

    await this.qualityRepository.remove(quality);
    return { success: true };
  }

  async finalizeQualityAssessment(id: string, finalPrice: number) {
    const quality = await this.findOne(id);
    if (!quality) {
      throw new NotFoundException('Quality assessment not found');
    }

    const grade = this.calculateQualityGrade(quality);
    quality.grade = grade;
    quality.suggested_price = finalPrice;
    quality.assessed_at = new Date();
    quality.updated_at = new Date();

    const savedQuality = await this.qualityRepository.save(quality);

    // If this is the only completed assessment, make it primary
    const completedAssessments = await this.qualityRepository.count({
      where: { 
        produce_id: quality.produce_id,
        assessed_at: Not(IsNull())
      }
    });

    if (completedAssessments === 1) {
      await this.setPrimaryAssessment(savedQuality.id, savedQuality.produce_id);
    }

    return savedQuality;
  }

  private calculateQualityGrade(quality: QualityAssessment): QualityGrade {
    const criteria = quality.criteria;
    let score = 0;

    switch (criteria.category) {
      case ProduceCategory.FOOD_GRAINS: {
        score = this.calculateFoodGrainsScore(criteria);
        break;
      }
      case ProduceCategory.FRUITS: {
        score = this.calculateFruitsScore(criteria);
        break;
      }
      // Add other category calculations as needed
      default:
        score = 70; // Default score if category not handled
    }

    if (score >= 90) return QualityGrade.A;
    if (score >= 75) return QualityGrade.B;
    if (score >= 60) return QualityGrade.C;
    if (score >= 40) return QualityGrade.D;
    return QualityGrade.REJECTED;
  }

  private calculateFoodGrainsScore(criteria: any): number {
    let score = 0;
    // Moisture content: Lower is better (optimal 12-14%)
    score += (100 - Math.abs(13 - criteria.moistureContent) * 5) * 0.4;
    // Foreign matter: Lower is better (should be < 2%)
    score += (100 - criteria.foreignMatter * 25) * 0.4;
    if (criteria.proteinContent) {
      // Protein content: Higher is better (optimal >12% for wheat)
      score += (criteria.proteinContent * 8) * 0.2;
    }
    return score;
  }

  private calculateFruitsScore(criteria: any): number {
    let score = 0;
    // Sweetness: Higher is better
    score += (criteria.sweetness * 10) * 0.4;
    // Color and ripeness
    score += (criteria.color === 'optimal' ? 100 : 70) * 0.3;
    // Size
    score += (criteria.size === 'large' ? 100 : criteria.size === 'medium' ? 80 : 60) * 0.3;
    return score;
  }
} 