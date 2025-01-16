import { Controller, Post, Get, Body, Query, UseGuards } from "@nestjs/common";
import { BusinessMetricsService } from "../services/business-metrics.service";
import { BusinessMetric } from "../entities/business-metric.entity";
import { MetricType, MetricCategory } from "../enums/metric-type.enum";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";

@Controller("business-metrics")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BusinessMetricsController {
  constructor(private readonly businessMetricsService: BusinessMetricsService) {}

  @Post()
  async create(
    @Body()
    data: {
      type: MetricType;
      category: MetricCategory;
      data: {
        value: number;
        change_percentage?: number;
        breakdown?: Record<string, number>;
      };
      period_start: Date;
      period_end: Date;
    },
  ): Promise<BusinessMetric> {
    return this.businessMetricsService.create(data);
  }

  @Get()
  async findByPeriod(
    @Query("type") type: MetricType,
    @Query("category") category: MetricCategory,
    @Query("start") start: Date,
    @Query("end") end: Date,
  ): Promise<BusinessMetric[]> {
    return this.businessMetricsService.findByPeriod(type, category, start, end);
  }

  @Get("latest")
  async getLatestMetric(
    @Query("type") type: MetricType,
    @Query("category") category: MetricCategory,
  ): Promise<BusinessMetric> {
    return this.businessMetricsService.getLatestMetric(type, category);
  }
} 