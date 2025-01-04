import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quality } from './entities/quality.entity';
import { QualityGrade } from '../produce/enums/quality-grade.enum';
import { CreateQualityDto } from './dto/create-quality.dto';

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(Quality)
    private readonly qualityRepository: Repository<Quality>
  ) {}

  async create(createQualityDto: CreateQualityDto) {
    const quality = new Quality();
    Object.assign(quality, {
      ...createQualityDto,
      grade: this.calculateQualityGrade(
        Object.values(createQualityDto.criteria).reduce((a, b) => a + b, 0) / 4
      ),
      createdAt: new Date(),
      updatedAt: new Date()
    });

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
    return this.qualityRepository.findOne({
      where: { id },
      relations: ['produce']
    });
  }

  async finalizeQualityAssessment(id: string, finalPrice: number) {
    const quality = await this.findOne(id);
    if (!quality) return null;

    const grade = this.calculateQualityGrade(
      Object.values(quality.criteria).reduce((a, b) => a + b, 0) / 4
    );

    const priceMultiplier = this.calculatePriceMultiplier(grade);
    const adjustedPrice = finalPrice * priceMultiplier;

    Object.assign(quality, {
      grade,
      metadata: {
        ...quality.metadata,
        finalPrice: adjustedPrice,
        priceMultiplier,
        finalizedAt: new Date()
      },
      updatedAt: new Date()
    });

    return this.qualityRepository.save(quality);
  }

  private calculateQualityGrade(averageSeverity: number): QualityGrade {
    if (averageSeverity <= 2) return QualityGrade.A;
    if (averageSeverity <= 4) return QualityGrade.B;
    if (averageSeverity <= 7) return QualityGrade.C;
    return QualityGrade.D;
  }

  private calculatePriceMultiplier(grade: QualityGrade): number {
    switch (grade) {
      case QualityGrade.A:
        return 1.0;
      case QualityGrade.B:
        return 0.8;
      case QualityGrade.C:
        return 0.6;
      default:
        return 0.4;
    }
  }
} 