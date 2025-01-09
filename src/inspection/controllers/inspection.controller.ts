import { Controller, Post, Body, Get, Param, Put, UseGuards, Request } from '@nestjs/common';
import { InspectionService } from '../services/inspection.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@Controller('inspections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Post('request')
  @Roles(UserRole.FARMER, UserRole.BUYER)
  async requestInspection(
    @Request() req,
    @Body() data: { produce_id: string },
  ) {
    return this.inspectionService.createRequest({
      produce_id: data.produce_id,
      requester_id: req.user.id,
    });
  }

  @Get('by-produce/:produce_id')
  @Roles(UserRole.FARMER, UserRole.BUYER, UserRole.INSPECTOR)
  async getInspectionsByProduce(@Param('produce_id') produce_id: string) {
    return this.inspectionService.findByProduce(produce_id);
  }

  @Get('by-requester')
  @Roles(UserRole.FARMER, UserRole.BUYER)
  async getInspectionsByRequester(@Request() req) {
    return this.inspectionService.findByRequester(req.user.id);
  }

  @Get('by-inspector')
  @Roles(UserRole.INSPECTOR)
  async getInspectionsByInspector(@Request() req) {
    return this.inspectionService.findByInspector(req.user.id);
  }

  @Put(':id/assign')
  @Roles(UserRole.INSPECTOR)
  async assignInspector(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.inspectionService.assignInspector(id, req.user.id);
  }

  @Put(':id/submit-result')
  @Roles(UserRole.INSPECTOR)
  async submitInspectionResult(
    @Param('id') id: string,
    @Body() result: {
      quality_grade: number;
      defects?: string[];
      recommendations?: string[];
      images?: string[];
      notes?: string;
    },
  ) {
    return this.inspectionService.submitInspectionResult(id, result);
  }
} 