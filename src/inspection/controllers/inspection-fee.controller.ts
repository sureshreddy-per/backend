import { Controller, Body, Put, UseGuards } from '@nestjs/common';
import { InspectionFeeService } from '../services/inspection-fee.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { UpdateInspectionBaseFeeDto } from '../dto/update-inspection-base-fee.dto';
import { UpdateInspectionDistanceFeeDto } from '../dto/update-inspection-distance-fee.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Inspection Fees')
@Controller('inspection-fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InspectionFeeController {
  constructor(private readonly inspectionFeeService: InspectionFeeService) {}

  @Put('base-fee')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update base fee for a produce category' })
  @ApiResponse({
    status: 200,
    description: 'Base fee updated successfully',
  })
  async updateBaseFee(@Body() updateDto: UpdateInspectionBaseFeeDto) {
    return this.inspectionFeeService.updateBaseFee(
      updateDto.produce_category,
      updateDto.base_fee,
      updateDto.updated_by,
    );
  }

  @Put('distance-fee')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update distance-based fee configuration' })
  @ApiResponse({
    status: 200,
    description: 'Distance fee updated successfully',
  })
  async updateDistanceFee(@Body() updateDto: UpdateInspectionDistanceFeeDto) {
    return this.inspectionFeeService.updateDistanceFee(
      updateDto.min_distance,
      updateDto.max_distance,
      updateDto.fee,
      updateDto.updated_by,
    );
  }
}