import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Report, ReportType, ReportFormat, ReportStatus } from '../entities/report.entity';
import { ReportService } from '../services/report.service';

@Injectable()
export class ReportScheduler {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly reportService: ReportService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyReports() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Promise.all([
      this.createDailyReport(ReportType.TRANSACTION_SUMMARY, yesterday, today),
      this.createDailyReport(ReportType.PRODUCE_ANALYTICS, yesterday, today),
      this.createDailyReport(ReportType.QUALITY_METRICS, yesterday, today),
      this.createDailyReport(ReportType.MARKET_TRENDS, yesterday, today),
      this.createDailyReport(ReportType.FINANCIAL_SUMMARY, yesterday, today)
    ]);
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async generateMonthlyReports() {
    const firstDayOfLastMonth = new Date();
    firstDayOfLastMonth.setMonth(firstDayOfLastMonth.getMonth() - 1);
    firstDayOfLastMonth.setDate(1);
    firstDayOfLastMonth.setHours(0, 0, 0, 0);

    const firstDayOfThisMonth = new Date();
    firstDayOfThisMonth.setDate(1);
    firstDayOfThisMonth.setHours(0, 0, 0, 0);

    await Promise.all([
      this.createMonthlyReport(ReportType.TRANSACTION_SUMMARY, firstDayOfLastMonth, firstDayOfThisMonth),
      this.createMonthlyReport(ReportType.PRODUCE_ANALYTICS, firstDayOfLastMonth, firstDayOfThisMonth),
      this.createMonthlyReport(ReportType.QUALITY_METRICS, firstDayOfLastMonth, firstDayOfThisMonth),
      this.createMonthlyReport(ReportType.MARKET_TRENDS, firstDayOfLastMonth, firstDayOfThisMonth),
      this.createMonthlyReport(ReportType.FINANCIAL_SUMMARY, firstDayOfLastMonth, firstDayOfThisMonth)
    ]);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledReports() {
    const scheduledReports = await this.reportRepository.find({
      where: {
        status: ReportStatus.QUEUED,
        scheduled_time: LessThan(new Date())
      }
    });

    for (const report of scheduledReports) {
      await this.reportService.generateReport(report.id).catch(console.error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async cleanupOldReports() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.reportRepository.delete({
      created_at: LessThan(thirtyDaysAgo),
      status: ReportStatus.COMPLETED
    });
  }

  private async createDailyReport(type: ReportType, start: Date, end: Date) {
    return this.reportService.createReport(
      'SYSTEM',
      type,
      ReportFormat.PDF,
      {
        date_range: { start, end },
        filters: {},
        grouping: ['date'],
        metrics: ['count', 'sum', 'average']
      }
    );
  }

  private async createMonthlyReport(type: ReportType, start: Date, end: Date) {
    return this.reportService.createReport(
      'SYSTEM',
      type,
      ReportFormat.PDF,
      {
        date_range: { start, end },
        filters: {},
        grouping: ['week', 'category'],
        metrics: ['count', 'sum', 'average', 'min', 'max']
      }
    );
  }
} 