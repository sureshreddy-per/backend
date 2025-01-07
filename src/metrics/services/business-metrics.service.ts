import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BusinessMetric, BusinessMetricType } from '../entities/business-metric.entity';
import { BaseService } from '../../common/base.service';

@Injectable()
export class BusinessMetricsService extends BaseService<BusinessMetric> {
  constructor(
    @InjectRepository(BusinessMetric)
    private readonly businessMetricRepository: Repository<BusinessMetric>
  ) {
    super(businessMetricRepository);
  }

  async getMetricCount(type: BusinessMetricType, since: Date): Promise<number> {
    return this.businessMetricRepository.count({
      where: {
        type,
        created_at: Between(since, new Date())
      }
    });
  }

  async getValueSum(type: BusinessMetricType, since: Date): Promise<number> {
    const result = await this.businessMetricRepository
      .createQueryBuilder('metric')
      .select('SUM(metric.value)', 'sum')
      .where('metric.type = :type', { type })
      .andWhere('metric.created_at >= :since', { since })
      .getRawOne();

    return result?.sum || 0;
  }

  async getAverageProcessingTime(type: BusinessMetricType, since: Date): Promise<number> {
    const result = await this.businessMetricRepository
      .createQueryBuilder('metric')
      .select('AVG(metric.processing_time)', 'avg')
      .where('metric.type = :type', { type })
      .andWhere('metric.created_at >= :since', { since })
      .getRawOne();

    return result?.avg || 0;
  }

  async getTopUsers(type: BusinessMetricType, since: Date, limit: number = 10): Promise<any[]> {
    return this.businessMetricRepository
      .createQueryBuilder('metric')
      .select('metric.user_id', 'userId')
      .addSelect('COUNT(*)', 'count')
      .where('metric.type = :type', { type })
      .andWhere('metric.created_at >= :since', { since })
      .groupBy('metric.user_id')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getErrorRateByPath(since: Date, until: Date): Promise<Record<string, number>> {
    const results = await this.businessMetricRepository
      .createQueryBuilder('metric')
      .select('metric.path', 'path')
      .addSelect('COUNT(*) FILTER (WHERE metric.status = :errorStatus)', 'errors')
      .addSelect('COUNT(*)', 'total')
      .where('metric.created_at BETWEEN :since AND :until', { since, until })
      .groupBy('metric.path')
      .setParameter('errorStatus', 'ERROR')
      .getRawMany();

    return results.reduce((acc, { path, errors, total }) => ({
      ...acc,
      [path]: (parseInt(errors) / parseInt(total)) * 100
    }), {});
  }

  async getResponseTimePercentiles(since: Date, until: Date): Promise<Record<string, number>> {
    const results = await this.businessMetricRepository
      .createQueryBuilder('metric')
      .select('metric.path', 'path')
      .addSelect('PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric.response_time)', 'p50')
      .addSelect('PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric.response_time)', 'p95')
      .addSelect('PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric.response_time)', 'p99')
      .where('metric.created_at BETWEEN :since AND :until', { since, until })
      .groupBy('metric.path')
      .getRawMany();

    return results.reduce((acc, { path, p50, p95, p99 }) => ({
      ...acc,
      [path]: { p50, p95, p99 }
    }), {});
  }

  async getHourlyDistribution(type: BusinessMetricType, since: Date): Promise<Record<number, number>> {
    const results = await this.businessMetricRepository
      .createQueryBuilder('metric')
      .select('EXTRACT(HOUR FROM metric.created_at)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('metric.type = :type', { type })
      .andWhere('metric.created_at >= :since', { since })
      .groupBy('hour')
      .orderBy('hour')
      .getRawMany();

    return results.reduce((acc, { hour, count }) => ({
      ...acc,
      [parseInt(hour)]: parseInt(count)
    }), {});
  }

  async getDailyPrices(start: Date, end: Date): Promise<any[]> {
    return this.businessMetricRepository
      .createQueryBuilder('metric')
      .select('metric.created_at::date', 'date')
      .addSelect('metric.category', 'category')
      .addSelect('AVG(metric.value)', 'price')
      .where('metric.type = :type', { type: BusinessMetricType.DAILY_PRICE_UPDATE })
      .andWhere('metric.created_at BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .addGroupBy('category')
      .orderBy('date')
      .getRawMany();
  }
} 