import { Injectable } from "@nestjs/common";
import { EventMetricsService } from "../services/event-metrics.service";
import { EventMetricType } from "../entities/event-metric.entity";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class MetricsAggregationJob {
  constructor(
    private readonly eventMetricsService: EventMetricsService,
  ) {}

  @Cron("0 0 * * *") // Run at midnight every day
  async aggregateDailyMetrics() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // User metrics
    const [userRegistrations, userLogins, userVerifications] = await Promise.all([
      this.eventMetricsService.getMetricCount(
        EventMetricType.USER_REGISTRATION,
        yesterday,
        today
      ),
      this.eventMetricsService.getMetricCount(
        EventMetricType.USER_LOGIN,
        yesterday,
        today
      ),
      this.eventMetricsService.getMetricCount(
        EventMetricType.USER_VERIFICATION,
        yesterday,
        today
      ),
    ]);

    // Produce metrics
    const [produceListings, produceInspections, produceQualityUpdates] = await Promise.all([
      this.eventMetricsService.getMetricCount(
        EventMetricType.PRODUCE_LISTING,
        yesterday,
        today
      ),
      this.eventMetricsService.getMetricCount(
        EventMetricType.PRODUCE_INSPECTION,
        yesterday,
        today
      ),
      this.eventMetricsService.getMetricCount(
        EventMetricType.PRODUCE_QUALITY_UPDATE,
        yesterday,
        today
      ),
    ]);

    // Offer metrics
    const [offerCreations, offerAcceptances, offerRejections, offerExpiries] = await Promise.all([
      this.eventMetricsService.getMetricCount(
        EventMetricType.OFFER_CREATION,
        yesterday,
        today
      ),
      this.eventMetricsService.getMetricCount(
        EventMetricType.OFFER_ACCEPTANCE,
        yesterday,
        today
      ),
      this.eventMetricsService.getMetricCount(
        EventMetricType.OFFER_REJECTION,
        yesterday,
        today
      ),
      this.eventMetricsService.getMetricCount(
        EventMetricType.OFFER_EXPIRY,
        yesterday,
        today
      ),
    ]);

    // Transaction metrics
    const [transactionCreations, transactionCompletions, transactionCancellations, paymentValue] = await Promise.all([
      this.eventMetricsService.getMetricCount(
        EventMetricType.TRANSACTION_CREATION,
        yesterday,
        today
      ),
      this.eventMetricsService.getMetricCount(
        EventMetricType.TRANSACTION_COMPLETION,
        yesterday,
        today
      ),
      this.eventMetricsService.getMetricCount(
        EventMetricType.TRANSACTION_CANCELLATION,
        yesterday,
        today
      ),
      this.eventMetricsService.getValueSum(
        EventMetricType.PAYMENT_PROCESSING,
        yesterday,
        today
      ),
    ]);

    // Performance metrics
    const [errorRates, responseTimes] = await Promise.all([
      this.eventMetricsService.getErrorRateByPath(yesterday, today),
      this.eventMetricsService.getResponseTimePercentiles(yesterday, today),
    ]);

    // Store daily summary
    await this.eventMetricsService.create({
      type: EventMetricType.DAILY_PRICE_UPDATE,
      metadata: {
        additional_info: {
          date: yesterday.toISOString().split("T")[0],
          users: {
            registrations: userRegistrations,
            logins: userLogins,
            verifications: userVerifications,
          },
          produce: {
            listings: produceListings,
            inspections: produceInspections,
            qualityUpdates: produceQualityUpdates,
          },
          offers: {
            created: offerCreations,
            accepted: offerAcceptances,
            rejected: offerRejections,
            expired: offerExpiries,
          },
          transactions: {
            created: transactionCreations,
            completed: transactionCompletions,
            cancelled: transactionCancellations,
            totalValue: paymentValue,
          },
          performance: {
            errorRates,
            responseTimes,
          },
        },
      },
    });
  }
}
