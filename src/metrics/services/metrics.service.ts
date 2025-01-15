import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import {
  RequestMetric,
  RequestStatus,
} from "../entities/request-metric.entity";

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(RequestMetric)
    private readonly requestMetricRepository: Repository<RequestMetric>,
  ) {}

  async logRequest(data: {
    path: string;
    method: string;
    user_id?: string;
    response_time: number;
    status: RequestStatus;
    error_message?: string;
    metadata?: {
      ip_address?: string;
      user_agent?: string;
      status_code?: number;
      request_body?: any;
      response_body?: any;
    };
  }): Promise<RequestMetric> {
    const metric = this.requestMetricRepository.create(data);
    return this.requestMetricRepository.save(metric);
  }

  async getRequestCount(since: Date): Promise<number> {
    return this.requestMetricRepository.count({
      where: {
        created_at: MoreThanOrEqual(since),
      },
    });
  }

  async getErrorCount(since: Date): Promise<number> {
    return this.requestMetricRepository.count({
      where: {
        status: RequestStatus.ERROR,
        created_at: MoreThanOrEqual(since),
      },
    });
  }

  async getAverageResponseTime(since: Date): Promise<number> {
    const result = await this.requestMetricRepository
      .createQueryBuilder("metric")
      .select("AVG(metric.response_time)", "avg_response_time")
      .where("metric.created_at >= :since", { since })
      .getRawOne();

    return result?.avg_response_time || 0;
  }

  async getActiveUserCount(since: Date): Promise<number> {
    const result = await this.requestMetricRepository
      .createQueryBuilder("metric")
      .select("COUNT(DISTINCT metric.user_id)", "active_users")
      .where("metric.created_at >= :since", { since })
      .andWhere("metric.user_id IS NOT NULL")
      .getRawOne();

    return result?.active_users || 0;
  }

  async getErrorRateByPath(
    since: Date,
    until: Date,
  ): Promise<
    Array<{ path: string; error_rate: number; total_requests: number }>
  > {
    const result = await this.requestMetricRepository
      .createQueryBuilder("metric")
      .select("metric.path", "path")
      .addSelect("COUNT(*)", "total_requests")
      .addSelect(
        "ROUND(COUNT(CASE WHEN metric.status = :errorStatus THEN 1 END) * 100.0 / COUNT(*), 2)",
        "error_rate",
      )
      .where("metric.created_at >= :since", { since })
      .andWhere("metric.created_at <= :until", { until })
      .setParameter("errorStatus", RequestStatus.ERROR)
      .groupBy("metric.path")
      .getRawMany();

    return result;
  }

  async getResponseTimePercentiles(
    since: Date,
    until: Date,
  ): Promise<{
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  }> {
    // PostgreSQL-specific percentile calculation
    const result = await this.requestMetricRepository
      .createQueryBuilder("metric")
      .select(
        `PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY metric.response_time)`,
        "p50",
      )
      .addSelect(
        `PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY metric.response_time)`,
        "p90",
      )
      .addSelect(
        `PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric.response_time)`,
        "p95",
      )
      .addSelect(
        `PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric.response_time)`,
        "p99",
      )
      .where("metric.created_at >= :since", { since })
      .andWhere("metric.created_at <= :until", { until })
      .getRawOne();

    return {
      p50: result?.p50 || 0,
      p90: result?.p90 || 0,
      p95: result?.p95 || 0,
      p99: result?.p99 || 0,
    };
  }

  async cleanup(olderThan: Date): Promise<void> {
    await this.requestMetricRepository.delete({
      created_at: LessThanOrEqual(olderThan),
    });
  }
}
