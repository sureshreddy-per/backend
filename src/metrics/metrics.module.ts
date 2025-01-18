import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventMetric } from "./entities/event-metric.entity";
import { EventMetricsService } from "./services/event-metrics.service";
import { MetricsController } from "./controllers/metrics.controller";
import { MetricsAggregationJob } from "./jobs/metrics-aggregation.job";

@Module({
  imports: [
    TypeOrmModule.forFeature([EventMetric]),
  ],
  controllers: [MetricsController],
  providers: [EventMetricsService, MetricsAggregationJob],
  exports: [EventMetricsService],
})
export class MetricsModule {}
