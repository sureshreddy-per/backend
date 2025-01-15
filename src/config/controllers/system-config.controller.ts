import { Controller, Get, Put, Body, Param, UseGuards } from "@nestjs/common";
import { SystemConfigService } from "../services/system-config.service";
import { SystemConfigKey } from "../enums/system-config-key.enum";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("System Configuration")
@Controller("system-config")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get(":key")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get system configuration value" })
  @ApiResponse({
    status: 200,
    description: "Configuration value retrieved successfully",
  })
  async getValue(@Param("key") key: SystemConfigKey) {
    const value = await this.configService.getValue(key);
    return { key, value };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get all system configurations" })
  @ApiResponse({
    status: 200,
    description: "All configurations retrieved successfully",
  })
  async getAllConfigs() {
    return this.configService.getAllConfigs();
  }

  @Put(":key")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update system configuration value" })
  @ApiResponse({
    status: 200,
    description: "Configuration value updated successfully",
  })
  async updateValue(
    @Param("key") key: SystemConfigKey,
    @Body() body: { value: string; description?: string }
  ) {
    await this.configService.updateValue(
      key,
      body.value,
      body.description
    );
    return { message: "Configuration updated successfully" };
  }
}
