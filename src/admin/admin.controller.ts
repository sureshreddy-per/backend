import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('customers')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get customer statistics' })
  @ApiResponse({ status: 200, description: 'Returns customer statistics' })
  async getCustomerStats() {
    return this.adminService.getCustomerStats();
  }

  @Get('buyers')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get buyer statistics' })
  @ApiResponse({ status: 200, description: 'Returns buyer statistics' })
  async getBuyerStats() {
    return this.adminService.getBuyerStats();
  }

  @Get('support')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get support ticket statistics' })
  @ApiResponse({ status: 200, description: 'Returns support ticket statistics' })
  async getSupportStats() {
    return this.adminService.getSupportStats();
  }
} 