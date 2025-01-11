import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";
import { InspectionFeeService } from "../../quality/services/inspection-fee.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Base Fee Configuration")
@Controller("config/base-fee")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BaseFeeConfigController {
  constructor(private readonly inspectionFeeService: InspectionFeeService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get base fee configuration" })
  @ApiResponse({
    status: 200,
    description: "Returns the base fee configuration",
  })
  async getBaseFeeConfig() {
    return { base_fee: this.inspectionFeeService.getBaseFee() };
  }

  @Put()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update base fee configuration" })
  @ApiResponse({
    status: 200,
    description: "Base fee updated successfully",
  })
  async updateBaseFee(@Body() data: { base_fee: number }) {
    this.inspectionFeeService.updateBaseFee(data.base_fee);
    return { message: "Base fee updated successfully" };
  }
}
