import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Report } from '../entities/report.entity';
import { ReportService } from '../services/report.service';
import { ReportStatus } from '../enums/report-status.enum';
import { ReportType } from '../enums/report-type.enum';
import { ReportFormat } from '../enums/report-format.enum';

@Injectable()
export class ReportScheduler {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly reportService: ReportService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyReports() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    await this.createDailyReport(ReportType.TRANSACTION_SUMMARY, yesterday, today);
    await this.createDailyReport(ReportType.USER_ACTIVITY, yesterday, today);
    await this.createDailyReport(ReportType.PRODUCE_ANALYTICS, yesterday, today);
    await this.createDailyReport(ReportType.QUALITY_METRICS, yesterday, today);
    await this.createDailyReport(ReportType.MARKET_TRENDS, yesterday, today);
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async generateMonthlyReports() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfPrevMonth = new Date(firstDayOfMonth);
    lastDayOfPrevMonth.setDate(lastDayOfPrevMonth.getDate() - 1);
    const firstDayOfPrevMonth = new Date(lastDayOfPrevMonth.getFullYear(), lastDayOfPrevMonth.getMonth(), 1);

    await this.createMonthlyReport(ReportType.TRANSACTION_SUMMARY, firstDayOfPrevMonth, lastDayOfPrevMonth);
    await this.createMonthlyReport(ReportType.USER_ACTIVITY, firstDayOfPrevMonth, lastDayOfPrevMonth);
    await this.createMonthlyReport(ReportType.PRODUCE_ANALYTICS, firstDayOfPrevMonth, lastDayOfPrevMonth);
    await this.createMonthlyReport(ReportType.QUALITY_METRICS, firstDayOfPrevMonth, lastDayOfPrevMonth);
    await this.createMonthlyReport(ReportType.MARKET_TRENDS, firstDayOfPrevMonth, lastDayOfPrevMonth);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processScheduledReports() {
    const scheduledReports = await this.reportRepository.find({
      where: {
        status: ReportStatus.QUEUED,
        scheduled_time: LessThan(new Date()),
      },
    });

    for (const report of scheduledReports) {
      await this.reportService.generateReport(
        report.type as unknown as ReportType,
        report.format as unknown as ReportFormat,
        report.parameters,
        report.user_id,
      ).catch(error => {
        console.error(`Failed to generate report ${report.id}:`, error);
        this.reportRepository.update(report.id, {
          status: ReportStatus.FAILED,
          error_message: error.message,
        });
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async cleanupOldReports() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.reportRepository.delete({
      created_at: LessThan(thirtyDaysAgo),
      status: ReportStatus.COMPLETED,
    });
  }

  private async createDailyReport(type: ReportType, start: Date, end: Date) {
    return this.reportService.createReport('SYSTEM', type, ReportFormat.PDF, {
      date_range: { start, end },
      filters: {},
      grouping: ["date"],
      metrics: ["count", "sum", "average"],
    });
  }

  private async createMonthlyReport(type: ReportType, start: Date, end: Date) {
    return this.reportService.createReport('SYSTEM', type, ReportFormat.PDF, {
      date_range: { start, end },
      filters: {},
      grouping: ["week", "category"],
      metrics: ["count", "sum", "average", "min", "max"],
    });
  }
}