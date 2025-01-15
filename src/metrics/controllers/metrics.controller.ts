import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { BusinessMetricsService } from "../services/business-metrics.service";
import { BusinessMetricType } from "../entities/business-metric.entity";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";

@Controller("metrics")
@Roles(UserRole.ADMIN)
export class MetricsController {
  constructor(
    private readonly businessMetricsService: BusinessMetricsService,
  ) {}

  @Get("dashboard")
  async getDashboardMetrics(@Query("since") since: Date) {
    const userMetrics = await Promise.all([
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.USER_REGISTRATION,
        since,
      ),
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.USER_LOGIN,
        since,
      ),
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.USER_VERIFICATION,
        since,
      ),
    ]);

    const produceMetrics = await Promise.all([
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.PRODUCE_LISTING,
        since,
      ),
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.PRODUCE_INSPECTION,
        since,
      ),
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.PRODUCE_QUALITY_UPDATE,
        since,
      ),
    ]);

    const offerMetrics = await Promise.all([
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.OFFER_CREATION,
        since,
      ),
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.OFFER_ACCEPTANCE,
        since,
      ),
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.OFFER_REJECTION,
        since,
      ),
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.OFFER_EXPIRY,
        since,
      ),
    ]);

    const transactionMetrics = await Promise.all([
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.TRANSACTION_CREATION,
        since,
      ),
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.TRANSACTION_COMPLETION,
        since,
      ),
      this.businessMetricsService.getMetricCount(
        BusinessMetricType.TRANSACTION_CANCELLATION,
        since,
      ),
      this.businessMetricsService.getValueSum(
        BusinessMetricType.PAYMENT_PROCESSING,
        since,
      ),
    ]);

    return {
      users: {
        registrations: userMetrics[0],
        logins: userMetrics[1],
        verifications: userMetrics[2],
      },
      produce: {
        listings: produceMetrics[0],
        inspections: produceMetrics[1],
        qualityUpdates: produceMetrics[2],
      },
      offers: {
        created: offerMetrics[0],
        accepted: offerMetrics[1],
        rejected: offerMetrics[2],
        expired: offerMetrics[3],
      },
      transactions: {
        created: transactionMetrics[0],
        completed: transactionMetrics[1],
        cancelled: transactionMetrics[2],
        totalValue: transactionMetrics[3],
      },
    };
  }

  @Get("performance")
  async getPerformanceMetrics(
    @Query("since") since: Date,
    @Query("until") until: Date,
  ) {
    const [errorRates, responseTimes] = await Promise.all([
      this.businessMetricsService.getErrorRateByPath(since, until),
      this.businessMetricsService.getResponseTimePercentiles(since, until),
    ]);

    return {
      errorRates,
      responseTimes,
    };
  }

  @Get("daily-prices")
  async getDailyPrices(@Query("start") start: Date, @Query("end") end: Date) {
    return this.businessMetricsService.getDailyPrices(start, end);
  }

  @Get("hourly-distribution")
  async getHourlyDistribution(
    @Query("type") type: BusinessMetricType,
    @Query("since") since: Date,
  ) {
    return this.businessMetricsService.getHourlyDistribution(type, since);
  }

  @Get("top-users")
  async getTopUsers(
    @Query("type") type: BusinessMetricType,
    @Query("since") since: Date,
    @Query("limit") limit: number,
  ) {
    return this.businessMetricsService.getTopUsers(type, since, limit);
  }
}
