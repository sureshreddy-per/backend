import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { BusinessMetric } from "./entities/business-metric.entity";
import { BusinessMetricsService } from "./services/business-metrics.service";
import { MetricsController } from "./controllers/metrics.controller";
import { MetricsAggregationJob } from "./jobs/metrics-aggregation.job";

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessMetric]),
    ScheduleModule.forRoot(),
  ],
  providers: [BusinessMetricsService, MetricsAggregationJob],
  controllers: [MetricsController],
  exports: [BusinessMetricsService],
})
export class MetricsModule {}
