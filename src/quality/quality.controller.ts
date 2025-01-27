import { Controller, Post, Body, Get, Param, UseGuards, BadRequestException, Put, Query } from "@nestjs/common";
import { QualityAssessmentService } from "./services/quality-assessment.service";
import { QualityAssessment } from "./entities/quality-assessment.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../enums/user-role.enum";
import { isValidQualityGrade } from "../produce/enums/quality-grade.enum";
import { CreateQualityAssessmentDto } from "./dto/create-quality-assessment.dto";
import { validateLocation } from "../common/utils/location.utils";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { RequestQualityInspectionDto } from "./dto/request-quality-inspection.dto";
import { InspectionRequest } from "./entities/inspection-request.entity";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "../users/entities/user.entity";
import { InspectionRequestService } from "./services/inspection-request.service";
import { ProduceService } from "../produce/services/produce.service";
import { validateRequiredFields } from "./utils/validation.util";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ListInspectionsDto } from './dto/list-inspections.dto';

@ApiTags('Quality Assessment')
@Controller("quality")
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityController {
  constructor(
    private readonly qualityAssessmentService: QualityAssessmentService,
    private readonly inspectionRequestService: InspectionRequestService,
    private readonly produceService: ProduceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post("ai-assessment")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create an AI-based quality assessment' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully', type: QualityAssessment })
  async createAIAssessment(
    @Body() data: CreateQualityAssessmentDto,
  ): Promise<QualityAssessment> {
    if (!isValidQualityGrade(data.quality_grade)) {
      throw new BadRequestException(`Invalid quality grade: ${data.quality_grade}. Must be between 0 and 10.`);
    }
    if (data.metadata?.location) {
      validateLocation(data.metadata.location);
    }

    // Set AI-specific metadata
    return this.qualityAssessmentService.create({
      ...data,
      metadata: {
        ...data.metadata,
        source: 'AI_ASSESSMENT',
        ai_model_version: data.metadata?.ai_model_version || 'gpt-4-vision-preview'
      }
    });
  }

  @Post("inspection")
  @Roles(UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Create a manual inspection quality assessment' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully', type: QualityAssessment })
  async createInspectionAssessment(
    @Body() data: CreateQualityAssessmentDto,
  ): Promise<QualityAssessment> {
    if (!isValidQualityGrade(data.quality_grade)) {
      throw new BadRequestException(`Invalid quality grade: ${data.quality_grade}. Must be between 0 and 10.`);
    }
    if (data.metadata?.location) {
      validateLocation(data.metadata.location);
    }

    // Set manual inspection specific metadata
    return this.qualityAssessmentService.create({
      ...data,
      metadata: {
        ...data.metadata,
        source: 'MANUAL_INSPECTION',
        inspector_id: data.metadata?.inspector_id,
        inspection_date: new Date().toISOString()
      }
    });
  }

  @Get("inspections")
  @ApiOperation({ summary: 'Get paginated list of inspections' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of inspections' })
  async listInspections(
    @GetUser() user: User,
    @Query() queryParams: ListInspectionsDto
  ) {
    return this.inspectionRequestService.findAll(
      user.id,
      user.role,
      queryParams
    );
  }

  @Get("assessments/by-produce/:produceId")
  @ApiOperation({ summary: 'Get all quality assessments for a produce' })
  @ApiResponse({ status: 200, description: 'Assessments found', type: [QualityAssessment] })
  async findByProduceId(@Param("produceId") produceId: string): Promise<QualityAssessment[]> {
    return this.qualityAssessmentService.findByProduceId(produceId);
  }

  @Get("assessments/by-produce/:produceId/latest")
  @ApiOperation({ summary: 'Get the latest quality assessment for a produce' })
  @ApiResponse({ status: 200, description: 'Latest assessment found', type: QualityAssessment })
  async findLatestByProduceId(@Param("produceId") produceId: string): Promise<QualityAssessment> {
    return this.qualityAssessmentService.findLatestByProduceId(produceId);
  }

  @Post("inspection/request")
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Request a manual quality inspection' })
  @ApiResponse({ status: 201, description: 'Inspection request created successfully', type: InspectionRequest })
  async requestInspection(
    @GetUser() user: User,
    @Body() data: RequestQualityInspectionDto,
  ): Promise<InspectionRequest> {
    return this.inspectionRequestService.create({
      produce_id: data.produce_id,
      requester_id: user.id,
    });
  }

  @Put("inspection/:id/assign")
  @Roles(UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Assign inspector to inspection request' })
  @ApiResponse({ status: 200, description: 'Inspector assigned successfully', type: InspectionRequest })
  async assignInspector(
    @GetUser() user: User,
    @Param("id") id: string,
  ): Promise<InspectionRequest> {
    return this.inspectionRequestService.assignInspector(id, user.id);
  }

  @Put("inspection/:id/submit-result")
  @Roles(UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Submit inspection result' })
  @ApiResponse({ status: 200, description: 'Inspection result submitted successfully', type: QualityAssessment })
  async submitInspectionResult(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body() data: CreateQualityAssessmentDto,
  ): Promise<QualityAssessment> {
    const request = await this.inspectionRequestService.findOne(id);
    if (request.inspector_id !== user.id) {
      throw new BadRequestException("Only assigned inspector can submit results");
    }

    if (!isValidQualityGrade(data.quality_grade)) {
      throw new BadRequestException(`Invalid quality grade: ${data.quality_grade}. Must be between 0 and 10.`);
    }

    // Get produce details to validate category-specific fields
    const produce = await this.produceService.findOne(request.produce_id);
    const validationResult = validateRequiredFields(produce.produce_category, data.category_specific_assessment);
    if (!validationResult.isValid) {
      throw new BadRequestException(`Missing required fields for category ${produce.produce_category}: ${validationResult.missingFields.join(', ')}`);
    }

    // Create quality assessment with required fields
    const assessment = await this.qualityAssessmentService.create({
      produce_id: request.produce_id,
      quality_grade: data.quality_grade,
      confidence_level: 100, // Manual inspection has 100% confidence
      defects: data.defects,
      recommendations: data.recommendations,
      category_specific_assessment: data.category_specific_assessment,
      metadata: {
        source: 'MANUAL_INSPECTION',
        inspector_id: user.id,
        inspection_date: new Date().toISOString(),
        inspection_request_id: id,
        notes: data.metadata?.notes,
        images: data.metadata?.images,
      }
    });

    // Mark inspection request as completed
    await this.inspectionRequestService.complete(id);

    // Emit quality assessment completed event
    await this.eventEmitter.emit('quality.assessment.completed', {
      produce_id: request.produce_id,
      quality_grade: assessment.quality_grade,
      confidence_level: assessment.confidence_level,
      detected_name: produce.name,
      description: produce.description,
      product_variety: produce.product_variety,
      produce_category: produce.produce_category,
      category_specific_attributes: assessment.category_specific_assessment,
      assessment_details: {
        defects: assessment.defects,
        recommendations: assessment.recommendations,
        metadata: assessment.metadata
      }
    });

    return assessment;
  }

  @Get("assessment/:id")
  @ApiOperation({ summary: 'Get a quality assessment by ID' })
  @ApiResponse({ status: 200, description: 'Assessment found', type: QualityAssessment })
  async findOne(@Param("id") id: string): Promise<QualityAssessment> {
    return this.qualityAssessmentService.findOne(id);
  }
}
