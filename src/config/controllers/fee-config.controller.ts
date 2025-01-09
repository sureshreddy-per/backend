import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InspectionDistanceFeeService } from '../services/fee-config.service';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateInspectionDistanceFeeDto } from '../dto/update-fee-config.dto';

@ApiTags('Configuration')
@Controller('config/inspection-distance-fees')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class InspectionDistanceFeeController {
  constructor(private readonly inspectionDistanceFeeService: InspectionDistanceFeeService) {}

  @Get()
  @ApiOperation({ summary: 'Get active inspection distance fee configuration' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the currently active inspection distance fee configuration',
    type: UpdateInspectionDistanceFeeDto
  })
  async getActiveConfig() {
    const config = await this.inspectionDistanceFeeService.getActiveConfig();
    return {
      fee_per_km: config?.fee_per_km || 5,
      max_distance_fee: config?.max_distance_fee || 500
    };
  }

  @Post()
  @ApiOperation({ summary: 'Update inspection distance fee configuration' })
  @ApiResponse({ 
    status: 200, 
    description: 'Updates the inspection distance fee configuration and returns the new settings',
    type: UpdateInspectionDistanceFeeDto
  })
  async updateConfig(
    @Body() updateDto: UpdateInspectionDistanceFeeDto,
    @Request() req: any
  ) {
    const updatedConfig = await this.inspectionDistanceFeeService.updateConfig(
      updateDto.fee_per_km,
      updateDto.max_distance_fee,
      req.user.id
    );

    return {
      fee_per_km: updatedConfig.fee_per_km,
      max_distance_fee: updatedConfig.max_distance_fee,
      updated_at: updatedConfig.updated_at
    };
  }
} 