import { Controller, Post, Body, Get, Param, UseGuards, BadRequestException } from "@nestjs/common";
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

@ApiTags('Quality Assessment')
@Controller("quality")
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityController {
  constructor(
    private readonly qualityAssessmentService: QualityAssessmentService,
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

  @Get(":id")
  @ApiOperation({ summary: 'Get a quality assessment by ID' })
  @ApiResponse({ status: 200, description: 'Assessment found', type: QualityAssessment })
  async findOne(@Param("id") id: string): Promise<QualityAssessment> {
    return this.qualityAssessmentService.findOne(id);
  }

  @Get("produce/:produceId")
  @ApiOperation({ summary: 'Get all quality assessments for a produce' })
  @ApiResponse({ status: 200, description: 'Assessments found', type: [QualityAssessment] })
  async findByProduceId(@Param("produceId") produceId: string): Promise<QualityAssessment[]> {
    return this.qualityAssessmentService.findByProduceId(produceId);
  }

  @Get("produce/:produceId/latest")
  @ApiOperation({ summary: 'Get the latest quality assessment for a produce' })
  @ApiResponse({ status: 200, description: 'Latest assessment found', type: QualityAssessment })
  async findLatestByProduceId(@Param("produceId") produceId: string): Promise<QualityAssessment> {
    return this.qualityAssessmentService.findLatestByProduceId(produceId);
  }
}
