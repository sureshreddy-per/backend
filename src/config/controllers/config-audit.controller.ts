import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";
import { ConfigAuditService } from "../services/config-audit.service";
import { SystemConfigKey } from "../enums/system-config-key.enum";
import { ConfigAuditLog } from "../entities/config-audit-log.entity";

@ApiTags("System Configuration Audit")
@Controller("config-audit")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ConfigAuditController {
  constructor(private readonly configAuditService: ConfigAuditService) {}

  @Get()
  @ApiOperation({ summary: "Get configuration audit logs" })
  @ApiResponse({ status: 200, description: "Returns configuration audit logs" })
  @ApiQuery({ name: "key", enum: SystemConfigKey, required: false })
  @ApiQuery({ name: "startDate", type: String, required: false })
  @ApiQuery({ name: "endDate", type: String, required: false })
  @ApiQuery({ name: "limit", type: Number, required: false })
  async getAuditLogs(
    @Query("key") key?: SystemConfigKey,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("limit") limit?: number,
  ): Promise<ConfigAuditLog[]> {
    return this.configAuditService.getAuditLogs(
      key,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit,
    );
  }

  @Get("latest")
  @ApiOperation({ summary: "Get latest configuration change" })
  @ApiResponse({
    status: 200,
    description: "Returns the latest configuration change",
  })
  @ApiQuery({ name: "key", enum: SystemConfigKey, required: true })
  async getLatestChange(
    @Query("key") key: SystemConfigKey,
  ): Promise<ConfigAuditLog | null> {
    return this.configAuditService.getLatestChange(key);
  }

  @Get("user")
  @ApiOperation({ summary: "Get configuration changes by user" })
  @ApiResponse({
    status: 200,
    description: "Returns configuration changes made by a user",
  })
  @ApiQuery({ name: "userId", type: String, required: true })
  @ApiQuery({ name: "limit", type: Number, required: false })
  async getChangesByUser(
    @Query("userId", ParseUUIDPipe) userId: string,
    @Query("limit") limit?: number,
  ): Promise<ConfigAuditLog[]> {
    return this.configAuditService.getChangesByUser(userId, limit);
  }
}
