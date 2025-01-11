import { Controller, Body, Put, UseGuards } from "@nestjs/common";
import { InspectionFeeService } from "../services/inspection-fee.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";

@ApiTags("Quality Inspection Fees")
@Controller("quality/fees")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeController {
  constructor(private readonly inspectionFeeService: InspectionFeeService) {}

  @Put("base-fee")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update base fee for a produce category" })
  @ApiResponse({
    status: 200,
    description: "Base fee updated successfully",
  })
  async updateBaseFee(
    @Body()
    data: {
      produce_category: ProduceCategory;
      base_fee: number;
    },
  ) {
    // Implementation will be added later
    return { message: "Base fee updated successfully" };
  }

  @Put("distance-fee")
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
    },
  ) {
    // Implementation will be added later
    return { message: "Distance fee updated successfully" };
  }
} 