import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, FindManyOptions } from "typeorm";
import { BusinessMetric, MetricType, MetricCategory } from "../entities/business-metric.entity";

@Injectable()
export class BusinessMetricsService {
  constructor(
    @InjectRepository(BusinessMetric)
    private readonly businessMetricRepository: Repository<BusinessMetric>,
  ) {}

  async create(data: {
    type: MetricType;
    category: MetricCategory;
    data: {
      value: number;
      change_percentage?: number;
      breakdown?: Record<string, number>;
    };
    period_start: Date;
    period_end: Date;
  }): Promise<BusinessMetric> {
    const metric = this.businessMetricRepository.create(data);
    return this.businessMetricRepository.save(metric);
  }

  async findAll(options?: FindManyOptions<BusinessMetric>): Promise<BusinessMetric[]> {
    return this.businessMetricRepository.find(options);
  }

  async findByPeriod(
    type: MetricType,
    category: MetricCategory,
    start: Date,
    end: Date,
  ): Promise<BusinessMetric[]> {
    return this.businessMetricRepository.find({
      where: {
        type,
        category,
        period_start: Between(start, end),
      },
      order: {
        period_start: "ASC",
      },
    });
  }

  async getLatestMetric(
    type: MetricType,
    category: MetricCategory,
  ): Promise<BusinessMetric> {
    return this.businessMetricRepository.findOne({
      where: {
        type,
        category,
      },
      order: {
        period_end: "DESC",
      },
    });
  }
} 