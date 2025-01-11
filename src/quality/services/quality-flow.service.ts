import { Injectable } from "@nestjs/common";
import { QualityAssessmentService } from "./quality-assessment.service";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { CategorySpecificAssessment } from "../interfaces/category-assessments.interface";

@Injectable()
export class QualityFlowService {
  constructor(
    private readonly qualityAssessmentService: QualityAssessmentService,
  ) {}

  async processQualityAssessment(
    produce_id: string,
    data: {
      quality_grade: number;
      defects?: string[];
      recommendations?: string[];
      images?: string[];
      notes?: string;
      inspector_id: string;
      inspection_id: string;
      category: ProduceCategory;
      category_specific_assessment: CategorySpecificAssessment;
    },
  ) {
    // Validation is handled by QualityAssessmentService
    return this.qualityAssessmentService.updateFromInspection(produce_id, {
      quality_grade: data.quality_grade,
      defects: data.defects,
      recommendations: data.recommendations,
      images: data.images,
      notes: data.notes,
      inspector_id: data.inspector_id,
      inspection_id: data.inspection_id,
      category_specific_assessment: data.category_specific_assessment as any,
    });
  }
}
