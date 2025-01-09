import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ReportService } from '../services/report.service';
import { ReportType, ReportFormat } from '../entities/report.entity';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

class CreateReportDto {
  type: ReportType;
  format: ReportFormat;
  parameters: {
    date_range?: {
      start: Date;
      end: Date;
    };
    filters?: Record<string, any>;
    grouping?: string[];
    metrics?: string[];
    custom_query?: any;
  };
}

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  async createReport(
    @CurrentUser('id') user_id: string,
    @Body() createReportDto: CreateReportDto
  ) {
    return this.reportService.createReport(
      user_id,
      createReportDto.type,
      createReportDto.format,
      createReportDto.parameters
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  async getReport(@Param('id') id: string) {
    return this.reportService.getReport(id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  async getUserReports(
    @CurrentUser('id') user_id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.reportService.getUserReports(user_id);
  }

  @Get('types')
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  getReportTypes() {
    return Object.values(ReportType);
  }

  @Get('formats')
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  getReportFormats() {
    return Object.values(ReportFormat);
  }
}