import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BusinessMetricsService } from '../services/business-metrics.service';
import { BusinessMetricType } from '../entities/business-metric.entity';

@Injectable()
export class MetricsAggregationJob {
  constructor(private readonly businessMetricsService: BusinessMetricsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateMetrics() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aggregate user metrics
    const userMetrics = await Promise.all([
      this.businessMetricsService.getMetricCount(BusinessMetricType.USER_REGISTRATION, yesterday),
      this.businessMetricsService.getMetricCount(BusinessMetricType.USER_LOGIN, yesterday),
      this.businessMetricsService.getMetricCount(BusinessMetricType.USER_VERIFICATION, yesterday)
    ]);

    // Aggregate produce metrics
    const produceMetrics = await Promise.all([
      this.businessMetricsService.getMetricCount(BusinessMetricType.PRODUCE_LISTING, yesterday),
      this.businessMetricsService.getMetricCount(BusinessMetricType.PRODUCE_INSPECTION, yesterday),
      this.businessMetricsService.getMetricCount(BusinessMetricType.PRODUCE_QUALITY_UPDATE, yesterday)
    ]);

    // Aggregate offer metrics
    const offerMetrics = await Promise.all([
      this.businessMetricsService.getMetricCount(BusinessMetricType.OFFER_CREATION, yesterday),
      this.businessMetricsService.getMetricCount(BusinessMetricType.OFFER_ACCEPTANCE, yesterday),
      this.businessMetricsService.getMetricCount(BusinessMetricType.OFFER_REJECTION, yesterday),
      this.businessMetricsService.getMetricCount(BusinessMetricType.OFFER_EXPIRY, yesterday)
    ]);

    // Aggregate transaction metrics
    const transactionMetrics = await Promise.all([
      this.businessMetricsService.getMetricCount(BusinessMetricType.TRANSACTION_CREATION, yesterday),
      this.businessMetricsService.getMetricCount(BusinessMetricType.TRANSACTION_COMPLETION, yesterday),
      this.businessMetricsService.getMetricCount(BusinessMetricType.TRANSACTION_CANCELLATION, yesterday),
      this.businessMetricsService.getValueSum(BusinessMetricType.PAYMENT_PROCESSING, yesterday)
    ]);

    // Get performance metrics
    const [errorRates, responseTimes] = await Promise.all([
      this.businessMetricsService.getErrorRateByPath(yesterday, today),
      this.businessMetricsService.getResponseTimePercentiles(yesterday, today)
    ]);

    // Store aggregated metrics
    await this.businessMetricsService.create({
      type: BusinessMetricType.DAILY_PRICE_UPDATE,
      metadata: {
        additional_info: {
          aggregation_date: yesterday.toISOString().split('T')[0],
          users: {
            registrations: userMetrics[0],
            logins: userMetrics[1],
            verifications: userMetrics[2]
          },
          produce: {
            listings: produceMetrics[0],
            inspections: produceMetrics[1],
            qualityUpdates: produceMetrics[2]
          },
          offers: {
            created: offerMetrics[0],
            accepted: offerMetrics[1],
            rejected: offerMetrics[2],
            expired: offerMetrics[3]
          },
          transactions: {
            created: transactionMetrics[0],
            completed: transactionMetrics[1],
            cancelled: transactionMetrics[2],
            totalValue: transactionMetrics[3]
          },
          performance: {
            errorRates,
            responseTimes
          }
        }
      }
    });
  }
} 