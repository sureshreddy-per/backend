import { Controller, Get, Post, Body, Param, Query, DefaultValuePipe, ParseIntPipe, UseGuards, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QualityService } from './quality.service';
import { CreateQualityAssessmentDto } from './dto/create-quality-assessment.dto';
import { QualityAssessment, InspectionMethod } from './entities/quality-assessment.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { QualityGrade } from '../produce/enums/quality-grade.enum';
import { ImageUrlValidationPipe } from './pipes/image-url.validation.pipe';

@ApiTags('Quality')
@ApiBearerAuth()
@Controller('quality')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post()
  @Roles(Role.INSPECTOR)
  create(@Body() createQualityDto: CreateQualityAssessmentDto): Promise<QualityAssessment> {
    return this.qualityService.create(createQualityDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<QualityAssessment>> {
    return this.qualityService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<QualityAssessment> {
    return this.qualityService.findOne(id);
  }

  // New inspection-related endpoints
  @Get('inspector/my-assessments')
  @Roles(Role.INSPECTOR)
  @ApiOperation({ summary: 'Get assessments by current inspector' })
  async findMyAssessments(@GetUser() user: User) {
    return this.qualityService.findByInspector(user.id);
  }

  @Get('pending')
  @Roles(Role.ADMIN, Role.INSPECTOR)
  @ApiOperation({ summary: 'Get pending quality assessments' })
  async findPendingAssessments() {
    return this.qualityService.findPendingInspections();
  }

  @Put(':id/assign/:inspectorId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign inspector to assessment' })
  async assignInspector(
    @Param('id') id: string,
    @Param('inspectorId') inspectorId: string,
  ) {
    return this.qualityService.assignInspector(id, inspectorId);
  }

  @Put(':id/method')
  @Roles(Role.INSPECTOR)
  @ApiOperation({ summary: 'Update assessment method' })
  async updateMethod(
    @Param('id') id: string,
    @Body('method') method: InspectionMethod,
  ) {
    return this.qualityService.updateAssessmentMethod(id, method);
  }

  @Put(':id/complete')
  @Roles(Role.INSPECTOR)
  @ApiOperation({ 
    summary: 'Complete quality assessment',
    description: 'Complete a quality assessment with grade, notes, and up to 3 images (jpg, jpeg, png, webp)'
  })
  @ApiResponse({
    status: 200,
    description: 'Quality assessment completed successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid image URLs or too many images'
  })
  async completeAssessment(
    @Param('id') id: string,
    @Body('grade') grade: QualityGrade,
    @Body('notes') notes?: string,
    @Body('imageUrls', ImageUrlValidationPipe) imageUrls?: string[],
  ) {
    return this.qualityService.completeAssessment(id, grade, notes, imageUrls);
  }
} 