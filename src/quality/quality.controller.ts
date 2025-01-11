import { Controller, Post, Body, Get, Param, Put, UseGuards, Request, BadRequestException, NotFoundException } from "@nestjs/common";
import { QualityAssessmentService } from "./services/quality-assessment.service";
import { QualityAssessment } from "./entities/quality-assessment.entity";
import { AssessmentSource } from "./enums/assessment-source.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../enums/user-role.enum";
import { isValidQualityGrade } from "../produce/enums/quality-grade.enum";
import { ProduceCategory } from "../produce/enums/produce-category.enum";
import { CategorySpecificAssessment } from "./interfaces/category-assessments.interface";
import { validateLocation } from "../common/utils/location.utils";
import { RequestQualityInspectionDto } from "./dto/request-quality-inspection.dto";
import { InspectionRequest } from "./entities/inspection-request.entity";

@Controller("quality")
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityController {
  constructor(
    private readonly qualityAssessmentService: QualityAssessmentService,
  ) {}

  @Post("ai-assessment")
  @Roles(UserRole.ADMIN)
  async createAIAssessment(
    @Body()
    data: {
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
    },
  ): Promise<QualityAssessment> {
    if (!isValidQualityGrade(data.quality_grade)) {
      throw new BadRequestException(`Invalid quality grade: ${data.quality_grade}. Must be between -1 and 10.`);
    }
    validateLocation(data.location);
    return this.qualityAssessmentService.createFromAI({
      ...data,
      category_specific_assessment: data.category_specific_assessment as any,
    });
  }

  @Post("inspection")
  @Roles(UserRole.INSPECTOR)
  async createInspectionAssessment(
    @Body()
    data: {
      produce_id: string;
      quality_grade: number;
      defects?: string[];
      recommendations?: string[];
      images?: string[];
      notes?: string;
      inspector_id: string;
      inspection_id: string;
      category: ProduceCategory;
      category_specific_assessment: CategorySpecificAssessment;
      location: string;
    },
  ): Promise<QualityAssessment> {
    if (!isValidQualityGrade(data.quality_grade)) {
      throw new BadRequestException(`Invalid quality grade: ${data.quality_grade}. Must be between -1 and 10.`);
    }
    validateLocation(data.location);
    return this.qualityAssessmentService.updateFromInspection(
      data.produce_id,
      {
        quality_grade: data.quality_grade,
        defects: data.defects,
        recommendations: data.recommendations,
        images: data.images,
        notes: data.notes,
        inspector_id: data.inspector_id,
        inspection_id: data.inspection_id,
        category_specific_assessment: data.category_specific_assessment as any,
      },
    );
  }

  @Get("produce/:produce_id")
  @Roles(UserRole.FARMER, UserRole.BUYER, UserRole.INSPECTOR)
  async getAssessmentsByProduce(
    @Param("produce_id") produce_id: string,
  ): Promise<QualityAssessment[]> {
    return this.qualityAssessmentService.findByProduce(produce_id);
  }

  @Get("produce/:produce_id/latest")
  @Roles(UserRole.FARMER, UserRole.BUYER, UserRole.INSPECTOR)
  async getLatestAssessment(
    @Param("produce_id") produce_id: string,
  ): Promise<QualityAssessment> {
    return this.qualityAssessmentService.getLatestAssessment(produce_id);
  }

  @Get("produce/:produce_id/latest-manual")
  @Roles(UserRole.FARMER, UserRole.BUYER, UserRole.INSPECTOR)
  async getLatestManualAssessment(
    @Param("produce_id") produce_id: string,
  ): Promise<QualityAssessment> {
    return this.qualityAssessmentService.getLatestManualAssessment(produce_id);
  }

  @Post("inspection/request")
  @Roles(UserRole.FARMER, UserRole.BUYER)
  async requestInspection(
    @Request() req,
    @Body() data: RequestQualityInspectionDto,
  ): Promise<InspectionRequest> {
    validateLocation(data.location);
    return this.qualityAssessmentService.requestInspection({
      ...data,
      requester_id: req.user.id,
    });
  }

  @Get("inspection/by-produce/:produce_id")
  @Roles(UserRole.FARMER, UserRole.BUYER, UserRole.INSPECTOR)
  async getInspectionsByProduce(
    @Param("produce_id") produce_id: string,
  ): Promise<InspectionRequest[]> {
    return this.qualityAssessmentService.findInspectionsByProduce(produce_id);
  }

  @Get("inspection/by-requester")
  @Roles(UserRole.FARMER, UserRole.BUYER)
  async getInspectionsByRequester(
    @Request() req,
  ): Promise<InspectionRequest[]> {
    return this.qualityAssessmentService.findInspectionsByRequester(req.user.id);
  }

  @Get("inspection/by-inspector")
  @Roles(UserRole.INSPECTOR)
  async getInspectionsByInspector(
    @Request() req,
  ): Promise<InspectionRequest[]> {
    return this.qualityAssessmentService.findInspectionsByInspector(req.user.id);
  }

  @Put("inspection/:id/assign")
  @Roles(UserRole.INSPECTOR)
  async assignInspector(
    @Param("id") id: string,
    @Request() req,
  ): Promise<InspectionRequest> {
    return this.qualityAssessmentService.assignInspector(id, req.user.id);
  }

  @Put("inspection/:id/submit-result")
  @Roles(UserRole.INSPECTOR)
  async submitInspectionResult(
    @Param("id") id: string,
    @Body() result: {
      quality_grade: number;
      defects?: string[];
      recommendations?: string[];
      images?: string[];
      notes?: string;
      category_specific_assessment: CategorySpecificAssessment;
    },
  ): Promise<QualityAssessment> {
    if (!isValidQualityGrade(result.quality_grade)) {
      throw new BadRequestException(
        `Invalid quality grade: ${result.quality_grade}. Must be between -1 and 10.`,
      );
    }
    return this.qualityAssessmentService.submitInspectionResult(id, result);
  }
}
