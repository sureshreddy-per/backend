import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quality } from './entities/quality.entity';
import { CreateQualityDto } from './dto/create-quality.dto';
import { UpdateQualityDto } from './dto/update-quality.dto';
import { AssessQualityDto } from './dto/assess-quality.dto';

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(Quality)
    private readonly qualityRepository: Repository<Quality>,
  ) {}

  async create(createQualityDto: CreateQualityDto): Promise<Quality> {
    const quality = this.qualityRepository.create(createQualityDto);
    return this.qualityRepository.save(quality);
  }

  async findAll(): Promise<Quality[]> {
    return this.qualityRepository.find();
  }

  async findOne(id: string): Promise<Quality> {
    const quality = await this.qualityRepository.findOne({ where: { id } });
    if (!quality) {
      throw new NotFoundException(`Quality with ID ${id} not found`);
    }
    return quality;
  }

  async findByProduceType(produceType: string): Promise<Quality[]> {
    return this.qualityRepository.find({
      where: { produceType },
    });
  }

  async update(id: string, updateQualityDto: UpdateQualityDto): Promise<Quality> {
    const quality = await this.findOne(id);
    Object.assign(quality, updateQualityDto);
    return this.qualityRepository.save(quality);
  }

  async remove(id: string): Promise<void> {
    const quality = await this.findOne(id);
    await this.qualityRepository.remove(quality);
  }

  async assessQuality(assessQualityDto: AssessQualityDto): Promise<number> {
    const quality = await this.findOne(assessQualityDto.qualityId);
    const params = quality.params;
    let score = 0;
    let totalWeight = 0;

    // Calculate quality score based on parameters and their weights
    for (const [param, value] of Object.entries(assessQualityDto.parameters)) {
      if (params[param]) {
        const { weight, maxScore } = params[param];
        const normalizedValue = Math.min(value, maxScore) / maxScore;
        score += normalizedValue * weight;
        totalWeight += weight;
      }
    }

    // Return normalized score (0-100)
    return (score / totalWeight) * 100;
  }

  async getQualityParameters(produceType: string): Promise<Record<string, any>> {
    const quality = await this.qualityRepository.findOne({
      where: { produceType },
    });

    if (!quality) {
      throw new NotFoundException(`Quality parameters for ${produceType} not found`);
    }

    return quality.params;
  }
} 