import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Report } from "./entities/report.entity";
import { ReportService } from "./services/report.service";
import { ReportController } from "./controllers/report.controller";
import { ReportScheduler } from "./jobs/report-scheduler.job";
import { UsersModule } from "../users/users.module";
import { ProduceModule } from "../produce/produce.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { QualityModule } from "../quality/quality.module";
import { MetricsModule } from "../metrics/metrics.module";
import { CommonModule } from "../common/common.module";
import { ScheduleModule } from "@nestjs/schedule";
import { BusinessMetricsModule } from "../business-metrics/business-metrics.module";
import { BatchProcessorModule } from "../services/batch-processor.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Report]),
    ScheduleModule.forRoot(),
    UsersModule,
    ProduceModule,
    TransactionsModule,
    QualityModule,
    MetricsModule,
    CommonModule,
    BusinessMetricsModule,
    BatchProcessorModule,
  ],
  controllers: [ReportController],
  providers: [ReportService, ReportScheduler],
  exports: [ReportService],
})
export class ReportsModule {}
