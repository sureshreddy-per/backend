import { Controller, Post, Get, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { AdminActionType } from '../entities/admin-audit-log.entity';
import { UpdateSystemConfigDto } from '../dto/update-system-config.dto';
import { AssignInspectorDto } from '../dto/assign-inspector.dto';
import { AdminActionDto } from '../dto/admin-action.dto';
import { AuditLogFilterDto } from '../dto/audit-log-filter.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users/:id/block')
  async blockUser(
    @Param('id') user_id: string,
    @Body() actionDto: AdminActionDto,
    @Req() req: any
  ) {
    await this.adminService.blockUser(
      req.user.id,
      user_id,
      actionDto.reason,
      actionDto.duration_days || 0,
      req.ip
    );
    return { message: 'User blocked successfully' };
  }

  @Post('users/:id/unblock')
  async unblockUser(
    @Param('id') user_id: string,
    @Body() actionDto: AdminActionDto,
    @Req() req: any
  ) {
    await this.adminService.unblockUser(
      req.user.id,
      user_id,
      actionDto.reason,
      req.ip
    );
    return { message: 'User unblocked successfully' };
  }

  @Post('produce/:id/delete')
  async deleteProduce(
    @Param('id') produce_id: string,
    @Body() actionDto: AdminActionDto,
    @Req() req: any
  ) {
    await this.adminService.deleteProduce(
      req.user.id,
      produce_id,
      actionDto.reason,
      req.ip
    );
    return { message: 'Produce deleted successfully' };
  }

  @Post('offers/:id/cancel')
  async cancelOffer(
    @Param('id') offer_id: string,
    @Body() actionDto: AdminActionDto,
    @Req() req: any
  ) {
    await this.adminService.cancelOffer(
      req.user.id,
      offer_id,
      actionDto.reason,
      req.ip
    );
    return { message: 'Offer cancelled successfully' };
  }

  @Post('transactions/:id/cancel')
  async cancelTransaction(
    @Param('id') transaction_id: string,
    @Body() actionDto: AdminActionDto,
    @Req() req: any
  ) {
    await this.adminService.cancelTransaction(
      req.user.id,
      transaction_id,
      actionDto.reason,
      req.ip
    );
    return { message: 'Transaction cancelled successfully' };
  }

  @Post('produce/:id/assign-inspector')
  async assignInspector(
    @Param('id') produce_id: string,
    @Body() assignDto: AssignInspectorDto,
    @Req() req: any
  ) {
    await this.adminService.assignInspector(
      req.user.id,
      produce_id,
      assignDto.inspector_id,
      assignDto.priority,
      assignDto.notes,
      req.ip
    );
    return { message: 'Inspector assigned successfully' };
  }

  @Post('system/config')
  async updateSystemConfig(
    @Body() configDto: UpdateSystemConfigDto,
    @Req() req: any
  ) {
    await this.adminService.updateSystemConfig(
      req.user.id,
      configDto,
      req.ip
    );
    return { message: 'System configuration updated successfully' };
  }

  @Get('system/config')
  async getSystemConfig() {
    return await this.adminService.getSystemConfig();
  }

  @Get('audit-logs')
  async getAuditLogs(@Query() filterDto: AuditLogFilterDto) {
    return await this.adminService.getAuditLogs(filterDto);
  }

  @Get('metrics')
  async getSystemMetrics() {
    return await this.adminService.getSystemMetrics();
  }

  @Get('stats/users')
  async getUserStats() {
    return await this.adminService.getUserStats();
  }

  @Get('stats/transactions')
  async getTransactionStats() {
    return await this.adminService.getTransactionStats();
  }

  @Get('stats/revenue')
  async getRevenueStats() {
    return await this.adminService.getRevenueStats();
  }

  @Get('stats/produce')
  async getProduceStats() {
    return await this.adminService.getProduceStats();
  }
}