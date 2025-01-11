import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BusinessMetricsService } from "./services/business-metrics.service";
import { BusinessMetricsController } from "./controllers/business-metrics.controller";
import { BusinessMetric } from "./entities/business-metric.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BusinessMetric])],
  providers: [BusinessMetricsService],
  controllers: [BusinessMetricsController],
  exports: [BusinessMetricsService],
})
export class BusinessMetricsModule {} 