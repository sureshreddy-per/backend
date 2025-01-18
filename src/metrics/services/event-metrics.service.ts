import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, Not, IsNull } from "typeorm";
import {
  EventMetric,
  EventMetricType,
} from "../entities/event-metric.entity";

@Injectable()
export class EventMetricsService {
  constructor(
    @InjectRepository(EventMetric)
    private readonly eventMetricRepository: Repository<EventMetric>
  ) {}

  async create(data: Partial<EventMetric>): Promise<EventMetric> {
    const metric = this.eventMetricRepository.create(data);
    return this.eventMetricRepository.save(metric);
  }

  async getMetricCount(type: EventMetricType, startDate?: Date, endDate?: Date): Promise<number> {
    const query = this.eventMetricRepository.createQueryBuilder("metric")
      .where("metric.type = :type", { type });

    if (startDate && endDate) {
      query.andWhere("metric.created_at BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });
    }

    return query.getCount();
  }

  async getValueSum(type: EventMetricType, startDate?: Date, endDate?: Date): Promise<number> {
    const query = this.eventMetricRepository.createQueryBuilder("metric")
      .select("SUM(metric.value)", "sum")
      .where("metric.type = :type", { type });

    if (startDate && endDate) {
      query.andWhere("metric.created_at BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });
    }

    const result = await query.getRawOne();
    return result?.sum || 0;
  }

  async getErrorRateByPath(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const metrics = await this.eventMetricRepository.find({
      where: {
        created_at: Between(startDate, endDate),
        metadata: {
          error: Not(IsNull()),
        },
      },
    });

    const errorsByPath: Record<string, { total: number; errors: number }> = {};
    metrics.forEach((metric) => {
      const path = metric.metadata?.additional_info?.path || "unknown";
      if (!errorsByPath[path]) {
        errorsByPath[path] = { total: 0, errors: 0 };
      }
      errorsByPath[path].total++;
      if (metric.metadata?.error) {
        errorsByPath[path].errors++;
      }
    });

    return Object.fromEntries(
      Object.entries(errorsByPath).map(([path, counts]) => [
        path,
        counts.errors / counts.total,
      ])
    );
  }

  async getResponseTimePercentiles(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const metrics = await this.eventMetricRepository.find({
      where: {
        created_at: Between(startDate, endDate),
        processing_time: Not(IsNull()),
      },
      order: {
        processing_time: "ASC",
      },
    });

    if (metrics.length === 0) {
      return {
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      };
    }

    const getPercentile = (arr: number[], p: number) => {
      const index = Math.ceil((p / 100) * arr.length) - 1;
      return arr[index];
    };

    const times = metrics.map((m) => m.processing_time).sort((a, b) => a - b);

    return {
      p50: getPercentile(times, 50),
      p90: getPercentile(times, 90),
      p95: getPercentile(times, 95),
      p99: getPercentile(times, 99),
    };
  }
}
