import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";
import { InspectionFeeService } from "../../quality/services/inspection-fee.service";

@Controller("config/base-fee")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BaseFeeConfigController {
  constructor(private readonly inspectionFeeService: InspectionFeeService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async getBaseFee() {
    return { base_fee: this.inspectionFeeService.BASE_FEE };
  }

  @Put()
  @Roles(UserRole.ADMIN)
  async updateBaseFee(@Body() data: { base_fee: number }) {
    // Implementation will be added later
    return { base_fee: data.base_fee };
  }
}
