import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AIInspectionService } from './ai-inspection.service';
import { QualityAssessment } from '../entities/quality-assessment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Produce, ProduceCategory } from '../../produce/entities/produce.entity';
import { ProduceStatus } from '../../produce/entities/produce.entity';
import { InspectionMethod } from '../entities/quality-assessment.entity';
import { QualityGrade } from '../../produce/enums/quality-grade.enum';
import { OpenAIService } from './openai.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OfferGeneratorService } from '../../offers/services/offer-generator.service';

@Injectable()
export class QualityFlowService {
  private readonly logger = new Logger(QualityFlowService.name);

  constructor(
    private readonly aiInspectionService: AIInspectionService,
    @InjectRepository(QualityAssessment)
    private readonly qualityAssessmentRepo: Repository<QualityAssessment>,
    @InjectRepository(Produce)
    private readonly produceRepo: Repository<Produce>,
    private readonly eventEmitter: EventEmitter2,
    private readonly offerGenerator: OfferGeneratorService,
    private readonly openAIService: OpenAIService
  ) {
    this.logger = new Logger(QualityFlowService.name);
  }

  @OnEvent('produce.created')
  async handleProduceCreated(produce: Produce) {
    this.logger.log(`New produce created: ${produce.id}`);
    
    try {
      // Get primary image for AI analysis
      const primaryImage = produce.images[0];
      if (!primaryImage) {
        throw new Error('No primary image found for produce');
      }

      // Analyze image using OpenAI
      const aiAnalysis = await this.openAIService.analyzeProduceImage(primaryImage);

      // Create quality assessment
      const assessment = await this.qualityAssessmentRepo.create({
        produce_id: produce.id,
        grade: this.mapToQualityGrade(aiAnalysis.quality_grade),
        method: InspectionMethod.AI_ASSISTED,
        detected_defects: aiAnalysis.detected_defects,
        recommendations: aiAnalysis.recommendations,
        confidence_level: aiAnalysis.confidence_level,
        category_specific_attributes: aiAnalysis.category_specific_attributes,
        imageUrls: [primaryImage]
      });

      await this.qualityAssessmentRepo.save(assessment);

      // Update produce with AI insights
      await this.produceRepo.update(produce.id, {
        name: aiAnalysis.name,
        produce_category: aiAnalysis.produce_category,
        product_variety: aiAnalysis.product_variety,
        description: aiAnalysis.description,
        quality_grade: this.mapToQualityGrade(aiAnalysis.quality_grade),
        status: ProduceStatus.AVAILABLE
      });

      // Emit event for offer generation
      this.eventEmitter.emit('quality.assessment.completed', assessment);
    } catch (error) {
      this.logger.error(`Error in AI analysis: ${error.message}`, error.stack);
      // Create a pending assessment that requires manual inspection
      const assessment = await this.qualityAssessmentRepo.create({
        produce_id: produce.id,
        grade: QualityGrade.PENDING,
        method: InspectionMethod.VISUAL,
        notes: 'AI analysis failed, manual inspection required',
        imageUrls: produce.images
      });
      await this.qualityAssessmentRepo.save(assessment);
    }
  }

  @OnEvent('inspection.requested')
  async handleInspectionRequested(data: { produce_id: string, requested_by: string }) {
    this.logger.log(`Inspection requested for produce ${data.produce_id}`);
    
    try {
      // Update produce status
      await this.produceRepo.update(data.produce_id, {
        status: ProduceStatus.PENDING_INSPECTION,
        is_inspection_requested: true,
        inspection_requested_by: data.requested_by,
        inspection_requested_at: new Date()
      });

      // Create a new quality assessment entry for manual inspection
      const assessment = await this.qualityAssessmentRepo.create({
        produce_id: data.produce_id,
        grade: QualityGrade.PENDING,
        method: InspectionMethod.VISUAL,
        notes: 'Manual inspection requested'
      });

      await this.qualityAssessmentRepo.save(assessment);
    } catch (error) {
      this.logger.error(`Error handling inspection request: ${error.message}`, error.stack);
    }
  }

  @OnEvent('inspection.completed')
  async handleInspectionCompleted(data: {
    assessment_id: string;
    produce_id: string;
    grade: QualityGrade;
    notes: string;
    imageUrls: string[];
    detected_defects?: string[];
    recommendations?: string[];
    category_specific_attributes?: Record<string, any>;
  }) {
    this.logger.log(`Manual inspection completed for produce ${data.produce_id}`);
    
    try {
      // Update quality assessment
      await this.qualityAssessmentRepo.update(data.assessment_id, {
        grade: data.grade,
        notes: data.notes,
        imageUrls: data.imageUrls,
        detected_defects: data.detected_defects,
        recommendations: data.recommendations,
        category_specific_attributes: data.category_specific_attributes,
        completedAt: new Date()
      });

      // Get produce details
      const produce = await this.produceRepo.findOne({ where: { id: data.produce_id } });
      if (!produce) {
        throw new Error(`Produce not found: ${data.produce_id}`);
      }

      // Update produce with final assessment
      const updatedProduce = await this.produceRepo.save({
        ...produce,
        quality_grade: data.grade,
        status: ProduceStatus.AVAILABLE
      });

      // Generate offers based on quality assessment
      await this.offerGenerator.generateOffersForProduce({
        id: updatedProduce.id,
        farmer_id: updatedProduce.farmer_id,
        produce_category: updatedProduce.produce_category,
        quality_grade: data.grade,
        quantity: updatedProduce.quantity,
        location: updatedProduce.location,
        categorySpecificAttributes: data.category_specific_attributes || {}
      });

      // Emit event for notification service
      this.eventEmitter.emit('inspection.completed', {
        produce_id: data.produce_id,
        grade: data.grade,
        has_offers: true
      });
    } catch (error) {
      this.logger.error(`Error handling inspection completion: ${error.message}`, error.stack);
    }
  }

  @OnEvent('quality.assessment.completed')
  async handleAssessmentCompleted(assessment: QualityAssessment) {
    this.logger.log(`Quality assessment completed for produce ${assessment.produce_id}`);
    
    try {
      // Update produce with final assessment
      await this.produceRepo.update(assessment.produce_id, {
        quality_grade: assessment.grade,
        status: ProduceStatus.AVAILABLE
      });
    } catch (error) {
      this.logger.error(`Error handling assessment completion: ${error.message}`, error.stack);
    }
  }

  private mapToQualityGrade(grade: string | number): QualityGrade {
    if (typeof grade === 'number') {
      // If it's already a number between 1-10, map it directly
      if (grade >= 1 && grade <= 10) {
        return QualityGrade[`GRADE_${Math.round(grade)}`];
      }
      // Default to middle grade if number is out of range
      return QualityGrade.GRADE_5;
    }

    // If it's a string, try to parse it as a number first
    const numericGrade = parseInt(grade);
    if (!isNaN(numericGrade) && numericGrade >= 1 && numericGrade <= 10) {
      return QualityGrade[`GRADE_${Math.round(numericGrade)}`];
    }

    // Handle legacy letter grades
    switch (grade.toUpperCase()) {
      case 'A':
        return QualityGrade.GRADE_9;
      case 'B':
        return QualityGrade.GRADE_6;
      case 'C':
        return QualityGrade.GRADE_3;
      case 'D':
        return QualityGrade.GRADE_1;
      case 'PENDING':
        return QualityGrade.PENDING;
      case 'REJECTED':
        return QualityGrade.REJECTED;
      default:
        return QualityGrade.GRADE_5;
    }
  }

  private mapToProduceCategory(category?: string): ProduceCategory {
    if (!category) return ProduceCategory.FOOD_GRAINS;

    const categoryMap: { [key: string]: ProduceCategory } = {
      'FOOD_GRAINS': ProduceCategory.FOOD_GRAINS,
      'OILSEEDS': ProduceCategory.OILSEEDS,
      'FRUITS': ProduceCategory.FRUITS,
      'VEGETABLES': ProduceCategory.VEGETABLES,
      'SPICES': ProduceCategory.SPICES,
      'FIBERS': ProduceCategory.FIBERS,
      'SUGARCANE': ProduceCategory.SUGARCANE,
      'FLOWERS': ProduceCategory.FLOWERS,
      'MEDICINAL': ProduceCategory.MEDICINAL
    };

    return categoryMap[category.toUpperCase()] || ProduceCategory.FOOD_GRAINS;
  }
} 