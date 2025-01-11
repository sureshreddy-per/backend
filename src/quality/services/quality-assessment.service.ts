import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { QualityAssessment } from "../entities/quality-assessment.entity";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { CategorySpecificAssessment } from "../interfaces/category-assessments.interface";
import { AssessmentSource } from "../enums/assessment-source.enum";
import { InspectionRequest, InspectionRequestStatus } from "../entities/inspection-request.entity";
import { ProduceService } from "../../produce/services/produce.service";
import { InspectionFeeService } from "./inspection-fee.service";
import { QualityAssessmentCompletedEvent } from "../events/quality-assessment-completed.event";

@Injectable()
export class QualityAssessmentService {
  constructor(
    @InjectRepository(QualityAssessment)
    private readonly qualityAssessmentRepository: Repository<QualityAssessment>,
    @InjectRepository(InspectionRequest)
    private readonly inspectionRequestRepository: Repository<InspectionRequest>,
    private readonly produceService: ProduceService,
    private readonly inspectionFeeService: InspectionFeeService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async emitAssessmentCompleted(assessment: QualityAssessment) {
    const event = new QualityAssessmentCompletedEvent(
      assessment.produce_id,
      assessment.quality_grade,
      assessment.confidence_level,
      assessment.id,
      assessment.source,
    );
    await this.eventEmitter.emit('quality.assessment.completed', event);
  }

  async createAssessment(data: {
    produce_id: string;
    quality_grade: number;
    confidence_level: number;
    defects?: string[];
    recommendations?: string[];
    images?: string[];
    notes?: string;
    inspector_id: string;
    inspection_request_id: string;
    category: ProduceCategory;
    category_specific_assessment: CategorySpecificAssessment;
  }): Promise<QualityAssessment> {
    const assessment = new QualityAssessment();
    assessment.produce_id = data.produce_id;
    assessment.quality_grade = data.quality_grade;
    assessment.defects = data.defects || [];
    assessment.recommendations = data.recommendations || [];
    assessment.confidence_level = data.confidence_level;
    assessment.category = data.category;
    assessment.category_specific_assessment = data.category_specific_assessment;
    assessment.source = AssessmentSource.MANUAL_INSPECTION;
    assessment.inspector_id = data.inspector_id;
    assessment.inspection_request_id = data.inspection_request_id;
    assessment.metadata = {
      images: data.images,
      assessment_parameters: {
        notes: data.notes,
      },
    };

    const savedAssessment = await this.qualityAssessmentRepository.save(assessment);
    await this.emitAssessmentCompleted(savedAssessment);
    return savedAssessment;
  }

  async createFromAI(data: {
    produce_id: string;
    quality_grade: number;
    confidence_level: number;
    defects?: string[];
    recommendations?: string[];
    description?: string;
    category: ProduceCategory;
    category_specific_assessment: CategorySpecificAssessment;
    location: string;
    metadata?: {
      ai_model_version?: string;
      assessment_parameters?: Record<string, any>;
      images?: string[];
    };
  }): Promise<QualityAssessment> {
    const assessment = new QualityAssessment();
    assessment.produce_id = data.produce_id;
    assessment.quality_grade = data.quality_grade;
    assessment.confidence_level = data.confidence_level;
    assessment.defects = data.defects || [];
    assessment.recommendations = data.recommendations || [];
    assessment.description = data.description;
    assessment.category = data.category;
    assessment.category_specific_assessment = data.category_specific_assessment;
    assessment.source = AssessmentSource.AI;
    assessment.metadata = {
      ...data.metadata,
      location: data.location,
    };

    const savedAssessment = await this.qualityAssessmentRepository.save(assessment);
    await this.emitAssessmentCompleted(savedAssessment);
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
      inspector_id: string;
      inspection_id: string;
      category_specific_assessment: CategorySpecificAssessment;
    },
  ): Promise<QualityAssessment> {
    const assessment = await this.getLatestAssessment(produce_id);
    if (!assessment) {
      throw new NotFoundException(`No assessment found for produce ${produce_id}`);
    }

    assessment.quality_grade = data.quality_grade;
    assessment.defects = data.defects || assessment.defects;
    assessment.recommendations = data.recommendations || assessment.recommendations;
    assessment.category_specific_assessment = data.category_specific_assessment;
    assessment.source = AssessmentSource.MANUAL_INSPECTION;
    assessment.metadata = {
      ...assessment.metadata,
      images: data.images,
      inspector_details: {
        id: data.inspector_id,
        notes: data.notes,
      },
      assessment_parameters: {
        ...assessment.metadata?.assessment_parameters,
        notes: data.notes,
      },
    };

    const savedAssessment = await this.qualityAssessmentRepository.save(assessment);
    await this.emitAssessmentCompleted(savedAssessment);
    return savedAssessment;
  }

  async findByInspectionId(inspection_id: string): Promise<QualityAssessment> {
    return this.qualityAssessmentRepository.findOne({
      where: { inspection_request_id: inspection_id },
    });
  }

  async findByInspectorId(inspector_id: string): Promise<QualityAssessment[]> {
    return this.qualityAssessmentRepository.find({
      where: { inspector_id },
      order: { created_at: "DESC" },
    });
  }

  async findByProduce(produce_id: string): Promise<QualityAssessment[]> {
    return this.qualityAssessmentRepository.find({
      where: { produce_id },
      order: { created_at: "DESC" },
    });
  }

  async getLatestAssessment(produce_id: string): Promise<QualityAssessment> {
    const assessment = await this.qualityAssessmentRepository.findOne({
      where: { produce_id },
      order: { created_at: "DESC" },
    });

    if (!assessment) {
      throw new NotFoundException(`No assessment found for produce ${produce_id}`);
    }

    return assessment;
  }

  async getLatestManualAssessment(produce_id: string): Promise<QualityAssessment> {
    const assessment = await this.qualityAssessmentRepository.findOne({
      where: { produce_id, source: AssessmentSource.MANUAL_INSPECTION },
      order: { created_at: "DESC" },
    });

    if (!assessment) {
      throw new NotFoundException(`No manual assessment found for produce ${produce_id}`);
    }

    return assessment;
  }

  async requestInspection(data: {
    produce_id: string;
    requester_id: string;
    location: string;
  }): Promise<InspectionRequest> {
    const produce = await this.produceService.findOne(data.produce_id);
    if (!produce) {
      throw new NotFoundException(`Produce with ID ${data.produce_id} not found`);
    }

    // Calculate inspection fee
    const fee = await this.inspectionFeeService.calculateInspectionFee({
      category: produce.produce_category,
      distance_km: this.calculateDistance(data.location),
    });

    // Create inspection request
    const request = new InspectionRequest();
    request.produce_id = data.produce_id;
    request.requester_id = data.requester_id;
    request.category = produce.produce_category;
    request.location = data.location;
    request.inspection_fee = fee.total_fee;
    request.status = InspectionRequestStatus.PENDING;

    return this.inspectionRequestRepository.save(request);
  }

  async findInspectionsByProduce(produce_id: string): Promise<InspectionRequest[]> {
    return this.inspectionRequestRepository.find({
      where: { produce_id },
      order: { created_at: "DESC" },
    });
  }

  async findInspectionsByRequester(requester_id: string): Promise<InspectionRequest[]> {
    return this.inspectionRequestRepository.find({
      where: { requester_id },
      order: { created_at: "DESC" },
    });
  }

  async findInspectionsByInspector(inspector_id: string): Promise<InspectionRequest[]> {
    return this.inspectionRequestRepository.find({
      where: { inspector_id },
      order: { created_at: "DESC" },
    });
  }

  async assignInspector(inspection_id: string, inspector_id: string): Promise<InspectionRequest> {
    const request = await this.inspectionRequestRepository.findOne({
      where: { id: inspection_id },
    });

    if (!request) {
      throw new NotFoundException(`Inspection request with ID ${inspection_id} not found`);
    }

    request.inspector_id = inspector_id;
    request.status = InspectionRequestStatus.IN_PROGRESS;
    request.assigned_at = new Date();

    return this.inspectionRequestRepository.save(request);
  }

  async submitInspectionResult(inspection_id: string, data: {
    quality_grade: number;
    defects?: string[];
    recommendations?: string[];
    images?: string[];
    notes?: string;
    category_specific_assessment: CategorySpecificAssessment;
  }): Promise<QualityAssessment> {
    const request = await this.inspectionRequestRepository.findOne({
      where: { id: inspection_id },
    });

    if (!request) {
      throw new NotFoundException(`Inspection request with ID ${inspection_id} not found`);
    }

    // Create quality assessment
    const assessment = await this.createAssessment({
      produce_id: request.produce_id,
      quality_grade: data.quality_grade,
      confidence_level: 1.0, // Manual inspection has 100% confidence
      defects: data.defects,
      recommendations: data.recommendations,
      category: request.category,
      category_specific_assessment: data.category_specific_assessment,
      inspector_id: request.inspector_id,
      inspection_request_id: request.id,
      images: data.images,
      notes: data.notes,
    });

    // Update inspection request status
    request.status = InspectionRequestStatus.COMPLETED;
    request.completed_at = new Date();
    await this.inspectionRequestRepository.save(request);

    return assessment;
  }

  private calculateDistance(location: string): number {
    // Implementation of distance calculation
    // This should be moved to a shared utility service
    return 0; // Placeholder
  }
}
