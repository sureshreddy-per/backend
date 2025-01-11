import { Controller, Body, Put, UseGuards, Get } from "@nestjs/common";
import { InspectionFeeService } from "../services/inspection-fee.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";

@ApiTags("Quality Inspection Fees")
@Controller("config/inspection-fees")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeController {
  constructor(private readonly inspectionFeeService: InspectionFeeService) {}

  @Get("base")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get base fee for inspections" })
  @ApiResponse({
    status: 200,
    description: "Returns the base fee configuration",
  })
  async getBaseFee() {
    return { base_fee: this.inspectionFeeService.getBaseFee() };
  }

  @Put("base")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update base fee for a produce category" })
  @ApiResponse({
    status: 200,
    description: "Base fee updated successfully",
  })
  async updateBaseFee(
    @Body()
    data: {
      base_fee: number;
    },
  ) {
    this.inspectionFeeService.updateBaseFee(data.base_fee);
    return { message: "Base fee updated successfully" };
  }

  @Get("distance")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get distance-based fee configuration" })
  @ApiResponse({
    status: 200,
    description: "Returns the distance fee configuration",
  })
  async getDistanceFee() {
    return this.inspectionFeeService.getDistanceFeeConfig();
  }

  @Put("distance")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update distance-based fee configuration" })
  @ApiResponse({
    status: 200,
    description: "Distance fee updated successfully",
  })
  async updateDistanceFee(
    @Body()
    data: {
      fee_per_km: number;
      max_fee: number;
    },
  ) {
    this.inspectionFeeService.updateDistanceFeeConfig(data);
    return { message: "Distance fee updated successfully" };
  }
} 