import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InspectionBaseFeeService } from '../services/base-fee-config.service';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateInspectionBaseFeeDto } from '../dto/update-base-fee.dto';

@ApiTags('Configuration')
@Controller('config/inspection-fees')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class InspectionBaseFeeController {
  constructor(private readonly inspectionBaseFeeService: InspectionBaseFeeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active inspection base fee configurations' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all active inspection base fee configurations',
    type: [UpdateInspectionBaseFeeDto]
  })
  async getAllConfigs() {
    const configs = await this.inspectionBaseFeeService.getAllActiveConfigs();
    return configs.map(config => ({
      produce_category: config.produce_category,
      inspection_base_fee: config.inspection_base_fee
    }));
  }

  @Post()
  @ApiOperation({ summary: 'Update inspection base fee configuration' })
  @ApiResponse({ 
    status: 200, 
    description: 'Updates the inspection base fee configuration and returns the new settings',
    type: UpdateInspectionBaseFeeDto
  })
  async updateConfig(
    @Body() updateDto: UpdateInspectionBaseFeeDto,
    @Request() req: any
  ) {
    const updatedConfig = await this.inspectionBaseFeeService.updateInspectionBaseFee(
      updateDto.produce_category,
      updateDto.inspection_base_fee,
      req.user.id
    );

    return {
      produce_category: updatedConfig.produce_category,
      inspection_base_fee: updatedConfig.inspection_base_fee,
      updated_at: updatedConfig.updated_at
    };
  }
} 