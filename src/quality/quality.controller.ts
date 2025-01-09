import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { QualityAssessmentService } from './services/quality-assessment.service';
import { QualityAssessment } from './entities/quality-assessment.entity';
import { AssessmentSource } from './entities/quality-assessment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('quality')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityController {
  constructor(private readonly qualityAssessmentService: QualityAssessmentService) {}

  @Post('ai-assessment')
  @Roles(UserRole.ADMIN)
  async createAIAssessment(@Body() data: {
    produce_id: string;
    quality_grade: number;
    confidence_level: number;
    defects?: string[];
    recommendations?: string[];
    description?: string;
    category_specific_assessment?: Record<string, any>;
    metadata?: {
      ai_model_version?: string;
      assessment_parameters?: Record<string, any>;
      images?: string[];
    };
  }): Promise<QualityAssessment> {
    return this.qualityAssessmentService.createFromAI(data);
  }

  @Post('inspection')
  @Roles(UserRole.INSPECTOR)
  async createInspectionAssessment(
    @Body() data: {
      produce_id: string;
      quality_grade: number;
      defects?: string[];
      recommendations?: string[];
      images?: string[];
      notes?: string;
      inspector_id?: string;
      inspection_id?: string;
    }
  ): Promise<QualityAssessment> {
    return this.qualityAssessmentService.updateFromInspection(data.produce_id, data);
  }

  @Get('produce/:produce_id')
  @Roles(UserRole.FARMER, UserRole.BUYER, UserRole.INSPECTOR)
  async getAssessmentsByProduce(@Param('produce_id') produce_id: string): Promise<QualityAssessment[]> {
    return this.qualityAssessmentService.findByProduce(produce_id);
  }

  @Get('produce/:produce_id/latest')
  @Roles(UserRole.FARMER, UserRole.BUYER, UserRole.INSPECTOR)
  async getLatestAssessment(@Param('produce_id') produce_id: string): Promise<QualityAssessment> {
    return this.qualityAssessmentService.getLatestAssessment(produce_id);
  }

  @Get('produce/:produce_id/latest-manual')
  @Roles(UserRole.FARMER, UserRole.BUYER, UserRole.INSPECTOR)
  async getLatestManualAssessment(@Param('produce_id') produce_id: string): Promise<QualityAssessment> {
    return this.qualityAssessmentService.getLatestManualAssessment(produce_id);
  }
}