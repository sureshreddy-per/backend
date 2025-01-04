import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quality } from './entities/quality.entity';
import { CreateQualityDto } from './dto/create-quality.dto';
import { UpdateQualityDto } from './dto/update-quality.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface QualityTrends {
  averageGrade: number;
  gradeHistory: { grade: number; date: Date }[];
  defectTrends: { defect: string; count: number }[];
  recommendations: string[];
}

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(Quality)
    private readonly qualityRepository: Repository<Quality>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createQualityDto: CreateQualityDto): Promise<Quality> {
    const quality = this.qualityRepository.create(createQualityDto);
    const savedQuality = await this.qualityRepository.save(quality);

    this.eventEmitter.emit('quality.created', {
      qualityId: savedQuality.id,
      grade: savedQuality.grade,
    });

    return savedQuality;
  }

  async findAll() {
    return this.qualityRepository.find();
  }

  async findOne(id: string): Promise<Quality> {
    const quality = await this.qualityRepository.findOne({
      where: { id },
    });

    if (!quality) {
      throw new NotFoundException(`Quality with ID ${id} not found`);
    }

    return quality;
  }

  async update(id: string, updateQualityDto: UpdateQualityDto): Promise<Quality> {
    const quality = await this.findOne(id);
    const previousGrade = quality.grade;

    const updatedQuality = await this.qualityRepository.save({
      ...quality,
      ...updateQualityDto,
    });

    this.eventEmitter.emit('quality.updated', {
      qualityId: updatedQuality.id,
      grade: updatedQuality.grade,
      gradeChanged: previousGrade !== updatedQuality.grade,
    });

    return updatedQuality;
  }

  async remove(id: string): Promise<void> {
    const quality = await this.findOne(id);
    await this.qualityRepository.remove(quality);

    this.eventEmitter.emit('quality.deleted', {
      qualityId: id,
    });
  }

  async getQualityTrends(assessments: Quality[]): Promise<QualityTrends> {
    const defectCounts = new Map<string, number>();
    const recommendations = new Set<string>();
    const gradeHistory: { grade: number; date: Date }[] = [];

    assessments.forEach(assessment => {
      gradeHistory.push({
        grade: assessment.grade,
        date: assessment.createdAt,
      });

      assessment.defects.forEach(defect => {
        defectCounts.set(defect, (defectCounts.get(defect) || 0) + 1);
      });

      assessment.recommendations.forEach(rec => recommendations.add(rec));
    });

    const averageGrade = assessments.reduce((sum, a) => sum + a.grade, 0) / assessments.length;

    return {
      averageGrade,
      gradeHistory,
      defectTrends: Array.from(defectCounts.entries()).map(([defect, count]) => ({
        defect,
        count,
      })),
      recommendations: Array.from(recommendations),
    };
  }

  async finalizeQualityAssessment(id: string, finalPrice: number): Promise<Quality> {
    const quality = await this.findOne(id);
    
    // Update quality record to mark it as finalized
    const updatedQuality = await this.qualityRepository.save({
      ...quality,
      isFinalized: true,
      finalizedAt: new Date(),
    });

    // Emit the quality.finalized event
    this.eventEmitter.emit('quality.finalized', {
      produceId: quality.produceId,
      qualityId: quality.id,
      grade: quality.grade,
      finalPrice: finalPrice
    });

    return updatedQuality;
  }
} 