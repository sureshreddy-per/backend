import { Controller, Get, Query } from "@nestjs/common";
import { EventMetricsService } from "../services/event-metrics.service";
import { EventMetricType } from "../entities/event-metric.entity";

@Controller("metrics")
export class MetricsController {
  constructor(
    private readonly eventMetricsService: EventMetricsService,
  ) {}

  @Get("user-registrations")
  async getUserRegistrations(@Query("since") since: string) {
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.eventMetricsService.getMetricCount(
      EventMetricType.USER_REGISTRATION,
      sinceDate,
      new Date()
    );
  }

  @Get("error-rates")
  async getErrorRates(@Query("since") since: string) {
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.eventMetricsService.getErrorRateByPath(sinceDate, new Date());
  }

  @Get("response-times")
  async getResponseTimes(@Query("since") since: string) {
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.eventMetricsService.getResponseTimePercentiles(sinceDate, new Date());
  }
}
