import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Report, ReportType, ReportFormat, ReportStatus } from '../entities/report.entity';
import { UsersService } from '../../users/services/users.service';
import { ProduceService } from '../../produce/services/produce.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { BusinessMetricsService } from '../../metrics/services/business-metrics.service';
import { S3Service } from '../../common/services/s3.service';
import { UserRole } from '../../users/entities/user.entity';
import { BusinessMetricType } from '../../metrics/entities/business-metric.entity';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { Readable } from 'stream';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly usersService: UsersService,
    private readonly produceService: ProduceService,
    private readonly transactionService: TransactionService,
    private readonly businessMetricsService: BusinessMetricsService,
    private readonly s3Service: S3Service
  ) {}

  async createReport(user_id: string, type: ReportType, format: ReportFormat, parameters: any) {
    const report = this.reportRepository.create({
      user_id,
      type,
      format,
      parameters,
      status: ReportStatus.QUEUED
    });

    await this.reportRepository.save(report);
    this.generateReport(report.id).catch(console.error);
    return report;
  }

  async getReport(id: string) {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async getUserReports(user_id: string) {
    return this.reportRepository.find({
      where: { user_id },
      order: { created_at: 'DESC' }
    });
  }

  async generateReport(report_id: string) {
    const report = await this.getReport(report_id);
    report.status = ReportStatus.GENERATING;
    await this.reportRepository.save(report);

    try {
      const data = await this.fetchReportData(report);
      const fileBuffer = await this.formatReport(data, report.format);
      const fileName = `reports/${report.type.toLowerCase()}_${report.id}.${report.format.toLowerCase()}`;
      
      const uploadResult = await this.s3Service.uploadFile(
        {
          buffer: fileBuffer,
          originalname: fileName,
          mimetype: this.getContentType(report.format)
        } as Express.Multer.File,
        'reports'
      );

      report.file_url = uploadResult;
      report.file_size = fileBuffer.length;
      report.status = ReportStatus.COMPLETED;
      report.completed_time = new Date();
      report.summary = this.generateSummary(data);
    } catch (error) {
      report.status = ReportStatus.FAILED;
      report.error_message = error.message;
    }

    await this.reportRepository.save(report);
  }

  private async fetchReportData(report: Report) {
    switch (report.type) {
      case ReportType.USER_ACTIVITY:
        return this.fetchUserActivityData(report.parameters);
      case ReportType.TRANSACTION_SUMMARY:
        return this.fetchTransactionData(report.parameters);
      case ReportType.PRODUCE_ANALYTICS:
        return this.fetchProduceData(report.parameters);
      case ReportType.QUALITY_METRICS:
        return this.fetchQualityData(report.parameters);
      case ReportType.MARKET_TRENDS:
        return this.fetchMarketTrendsData(report.parameters);
      case ReportType.FINANCIAL_SUMMARY:
        return this.fetchFinancialData(report.parameters);
      case ReportType.INSPECTION_SUMMARY:
        return this.fetchInspectionData(report.parameters);
      default:
        throw new Error('Unsupported report type');
    }
  }

  private async formatReport(data: any, format: ReportFormat): Promise<Buffer> {
    switch (format) {
      case ReportFormat.PDF:
        return this.generatePDF(data);
      case ReportFormat.EXCEL:
        return this.generateExcel(data);
      case ReportFormat.CSV:
        return this.generateCSV(data);
      case ReportFormat.JSON:
        return Buffer.from(JSON.stringify(data, null, 2));
      default:
        throw new Error('Unsupported format');
    }
  }

  private async generatePDF(data: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument();
      
      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add content to PDF
      doc.fontSize(16).text('Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(JSON.stringify(data, null, 2));
      
      doc.end();
    });
  }

  private async generateExcel(data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add headers
    const headers = Object.keys(data[0] || {});
    worksheet.addRow(headers);

    // Add data
    data.forEach(row => {
      worksheet.addRow(Object.values(row));
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  private generateCSV(data: any): Buffer {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return Buffer.from([headers, ...rows].join('\n'));
  }

  private getContentType(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.PDF:
        return 'application/pdf';
      case ReportFormat.EXCEL:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case ReportFormat.CSV:
        return 'text/csv';
      case ReportFormat.JSON:
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }

  private generateSummary(data: any) {
    return {
      total_records: data.length,
      aggregates: this.calculateAggregates(data),
      highlights: this.findHighlights(data)
    };
  }

  private calculateAggregates(data: any[]) {
    // Implement aggregation logic based on data type
    return {};
  }

  private findHighlights(data: any[]) {
    // Implement highlights extraction logic
    return [];
  }

  private async fetchUserActivityData(parameters: any) {
    const { date_range, filters } = parameters;
    const metrics = await this.businessMetricsService.findAll({
      where: {
        type: In([
          BusinessMetricType.USER_REGISTRATION,
          BusinessMetricType.USER_LOGIN,
          BusinessMetricType.USER_VERIFICATION
        ]),
        created_at: Between(date_range.start, date_range.end),
        ...(filters?.user_id ? { user_id: filters.user_id } : {})
      }
    });
    return this.transformUserActivityData(metrics);
  }

  private async fetchTransactionData(parameters: any) {
    const { date_range, filters } = parameters;
    const transactions = await this.transactionService.findAll({
      where: {
        created_at: Between(date_range.start, date_range.end),
        ...filters
      },
      relations: ['buyer', 'farmer', 'produce']
    });

    return this.transformTransactionData(transactions);
  }

  private async fetchProduceData(parameters: any) {
    const { date_range, filters } = parameters;
    const produce = await this.produceService.findAll({
      where: {
        created_at: Between(date_range.start, date_range.end),
        ...filters
      },
      relations: ['farmer', 'quality_assessments']
    });

    return this.transformProduceData(produce);
  }

  private async fetchQualityData(parameters: any) {
    const { date_range, filters } = parameters;
    const assessments = await this.produceService.findAll({
      where: {
        created_at: Between(date_range.start, date_range.end),
        ...filters
      },
      relations: ['quality_assessments', 'quality_assessments.inspector']
    });

    return this.transformQualityData(assessments);
  }

  private async fetchMarketTrendsData(parameters: any) {
    const { date_range, filters } = parameters;
    const [transactions, produce] = await Promise.all([
      this.transactionService.findAll({
        where: {
          created_at: Between(date_range.start, date_range.end),
          ...filters
        },
        relations: ['produce']
      }),
      this.produceService.findAll({
        where: {
          created_at: Between(date_range.start, date_range.end),
          ...filters
        }
      })
    ]);

    return this.transformMarketTrendsData(transactions, produce, []);
  }

  private async fetchFinancialData(parameters: any) {
    const { date_range, filters } = parameters;
    const transactions = await this.transactionService.findAll({
      where: {
        created_at: Between(date_range.start, date_range.end),
        ...filters
      },
      relations: ['buyer', 'farmer', 'produce']
    });

    return this.transformFinancialData(transactions);
  }

  private async fetchInspectionData(parameters: any) {
    const { date_range, filters } = parameters;
    const [assessments, inspectors] = await Promise.all([
      this.produceService.findAll({
        where: {
          created_at: Between(date_range.start, date_range.end),
          ...filters
        },
        relations: ['quality_assessments', 'quality_assessments.inspector']
      }),
      this.usersService.findAll({
        where: {
          role: UserRole.INSPECTOR
        }
      })
    ]);

    return this.transformInspectionData(assessments, inspectors);
  }

  private transformUserActivityData(metrics: any[]) {
    // Implementation
    return metrics;
  }

  private transformTransactionData(transactions: any[]) {
    // Implementation
    return transactions;
  }

  private transformProduceData(produce: any[]) {
    // Implementation
    return produce;
  }

  private transformQualityData(assessments: any[]) {
    // Implementation
    return assessments;
  }

  private transformMarketTrendsData(transactions: any[], produce: any[], dailyPrices: any[]) {
    // Implementation
    return { transactions, produce, dailyPrices };
  }

  private transformFinancialData(transactions: any[]) {
    // Implementation
    return transactions;
  }

  private transformInspectionData(assessments: any[], inspectors: any[]) {
    // Implementation
    return { assessments, inspectors };
  }
} 