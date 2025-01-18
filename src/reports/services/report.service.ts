import { Injectable, Logger, Inject, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, In } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Report } from "../entities/report.entity";
import { ReportType } from "../enums/report-type.enum";
import { ReportFormat } from "../enums/report-format.enum";
import { ReportStatus } from "../enums/report-status.enum";
import { BusinessMetricType } from "../../business-metrics/enums/business-metric-type.enum";
import { UserRole } from "../../enums/user-role.enum";
import { BusinessMetricsService } from "../../business-metrics/services/business-metrics.service";
import { TransactionService } from "../../transactions/services/transaction.service";
import { ProduceService } from "../../produce/services/produce.service";
import { UsersService } from "../../users/services/users.service";
import { BatchProcessorService } from "../../services/BatchProcessorService";
import { PaginatedResponse } from "../../common/interfaces/paginated-response.interface";
import { BusinessMetric } from "../../business-metrics/entities/business-metric.entity";
import { Transaction } from "../../transactions/entities/transaction.entity";
import { Produce } from '../../produce/entities/produce.entity';
import { User } from "../../users/entities/user.entity";
import * as ExcelJS from "exceljs";
import PDFDocument = require("pdfkit");

const CACHE_TTL = 3600; // 1 hour
const CACHE_PREFIX = 'report:';
const BATCH_SIZE = 50;

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly businessMetricsService: BusinessMetricsService,
    private readonly transactionService: TransactionService,
    private readonly produceService: ProduceService,
    private readonly usersService: UsersService,
    private readonly batchProcessor: BatchProcessorService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getCacheKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  async generateReport(
    type: ReportType,
    format: ReportFormat,
    parameters: any,
    user_id: string,
  ): Promise<Buffer> {
    try {
      const cacheKey = this.getCacheKey(`${type}:${format}:${JSON.stringify(parameters)}`);
      const cached = await this.cacheManager.get<Buffer>(cacheKey);
      if (cached) return cached;

      const report = this.reportRepository.create({
        type,
        format,
        parameters,
        user_id,
        status: ReportStatus.PROCESSING,
      } as Partial<Report>);

      const savedReport = await this.reportRepository.save(report);

      const data = await this.fetchReportData(savedReport);
      const formattedReport = await this.formatReport(data, format);

      await this.reportRepository.update(savedReport.id, {
        status: ReportStatus.COMPLETED,
        completed_at: new Date(),
      } as Partial<Report>);

      await this.cacheManager.set(cacheKey, formattedReport, CACHE_TTL);
      return formattedReport;
    } catch (error) {
      this.logger.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }

  private async fetchReportData(report: Report) {
    const cacheKey = this.getCacheKey(`data:${report.id}`);
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    let data;
    switch (report.type) {
      case ReportType.USER_ACTIVITY:
        data = await this.fetchUserActivityData(report.parameters);
        break;
      case ReportType.TRANSACTION_SUMMARY:
        data = await this.fetchTransactionData(report.parameters);
        break;
      case ReportType.PRODUCE_ANALYTICS:
        data = await this.fetchProduceData(report.parameters);
        break;
      case ReportType.QUALITY_METRICS:
        data = await this.fetchQualityData(report.parameters);
        break;
      case ReportType.MARKET_TRENDS:
        data = await this.fetchMarketTrendsData(report.parameters);
        break;
      case ReportType.FINANCIAL_SUMMARY:
        data = await this.fetchFinancialData(report.parameters);
        break;
      case ReportType.INSPECTION_SUMMARY:
        data = await this.fetchInspectionData(report.parameters);
        break;
      default:
        throw new Error("Unsupported report type");
    }

    await this.cacheManager.set(cacheKey, data, CACHE_TTL);
    return data;
  }

  private async fetchUserActivityData(parameters: any) {
    const { date_range, filters } = parameters;
    
    // Process in batches
    const result = [];
    let skip = 0;
    
    while (true) {
      const metrics = await this.businessMetricsService.findAll({
        where: {
          type: In([
            BusinessMetricType.USER_REGISTRATION,
            BusinessMetricType.USER_LOGIN,
            BusinessMetricType.USER_VERIFICATION,
          ]),
          created_at: Between(date_range.start, date_range.end),
          ...(filters?.user_id ? { user_id: filters.user_id } : {}),
        },
        take: BATCH_SIZE,
        skip,
      });

      if (!metrics.length) break;
      result.push(...metrics);
      skip += BATCH_SIZE;
    }

    return this.transformUserActivityData(result);
  }

  private async fetchTransactionData(parameters: any) {
    const { date_range, filters } = parameters;
    
    // Process in batches
    const result = [];
    let skip = 0;
    
    while (true) {
      const transactions = await this.transactionService.findAll({
        where: {
          created_at: Between(date_range.start, date_range.end),
          ...filters,
        },
        relations: ["buyer", "farmer", "produce"],
        take: BATCH_SIZE,
        skip,
      });

      if (!transactions.items.length) break;
      result.push(...transactions.items);
      skip += BATCH_SIZE;
    }

    return this.transformTransactionData(result);
  }

  private async fetchProduceData(parameters: any) {
    const { date_range, filters } = parameters;
    
    // Process in batches
    const result = [];
    let skip = 0;
    
    while (true) {
      const produce = await this.produceService.findAndPaginate({
        where: {
          created_at: Between(date_range.start, date_range.end),
          ...filters,
        },
        relations: ["farmer", "quality_assessments"],
        take: BATCH_SIZE,
        skip,
      });

      if (!produce.items.length) break;
      result.push(...produce.items);
      skip += BATCH_SIZE;
    }

    return this.transformProduceData(result);
  }

  private async fetchQualityData(parameters: any) {
    const { date_range, filters } = parameters;
    
    // Process in batches
    const result = [];
    let skip = 0;
    
    while (true) {
      const assessments = await this.produceService.findAndPaginate({
        where: {
          created_at: Between(date_range.start, date_range.end),
          ...filters,
        },
        relations: ["quality_assessments", "quality_assessments.inspector"],
        take: BATCH_SIZE,
        skip,
      });

      if (!assessments.items.length) break;
      result.push(...assessments.items);
      skip += BATCH_SIZE;
    }

    return this.transformQualityData(result);
  }

  private async fetchMarketTrendsData(parameters: any) {
    const { date_range, filters } = parameters;

    // Fetch data in parallel
    const [transactions, produce] = await Promise.all([
      this.fetchTransactionData({ date_range, filters }),
      this.fetchProduceData({ date_range, filters }),
    ]);

    return this.transformMarketTrendsData(transactions, produce, []);
  }

  private async fetchFinancialData(parameters: any) {
    const { date_range, filters } = parameters;
    
    // Process in batches
    const result = [];
    let skip = 0;
    
    while (true) {
      const transactions = await this.transactionService.findAll({
        where: {
          created_at: Between(date_range.start, date_range.end),
          ...filters,
        },
        relations: ["buyer", "farmer", "produce"],
        take: BATCH_SIZE,
        skip,
      });

      if (!transactions.items.length) break;
      result.push(...transactions.items);
      skip += BATCH_SIZE;
    }

    return this.transformFinancialData(result);
  }

  private async fetchInspectionData(parameters: any) {
    const { date_range, filters } = parameters;

    // Fetch data in parallel
    const [assessments, inspectors] = await Promise.all([
      this.fetchProduceData({ date_range, filters }),
      this.usersService.findByRole(UserRole.INSPECTOR),
    ]);

    return this.transformInspectionData(assessments, inspectors);
  }

  private async formatReport(data: any, format: ReportFormat): Promise<Buffer> {
    const cacheKey = this.getCacheKey(`format:${format}:${JSON.stringify(data)}`);
    const cached = await this.cacheManager.get<Buffer>(cacheKey);
    if (cached) return cached;

    let result: Buffer;
    switch (format) {
      case ReportFormat.PDF:
        result = await this.generatePDF(data);
        break;
      case ReportFormat.EXCEL:
        result = await this.generateExcel(data);
        break;
      case ReportFormat.CSV:
        result = await this.generateCSV(data);
        break;
      case ReportFormat.JSON:
        result = Buffer.from(JSON.stringify(data, null, 2));
        break;
      default:
        throw new Error("Unsupported format");
    }

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  private transformUserActivityData(
    metrics: PaginatedResponse<BusinessMetric> | BusinessMetric[],
  ) {
    const items = "items" in metrics ? metrics.items : metrics;
    return items;
  }

  private transformTransactionData(
    transactions: PaginatedResponse<Transaction> | Transaction[],
  ) {
    const items = "items" in transactions ? transactions.items : transactions;
    return items;
  }

  private transformProduceData(
    produce: PaginatedResponse<Produce> | Produce[],
  ) {
    const items = "items" in produce ? produce.items : produce;
    return items;
  }

  private transformQualityData(
    assessments: PaginatedResponse<Produce> | Produce[],
  ) {
    const items = "items" in assessments ? assessments.items : assessments;
    return items;
  }

  private transformMarketTrendsData(
    transactions: PaginatedResponse<Transaction> | Transaction[],
    produce: PaginatedResponse<Produce> | Produce[],
    dailyPrices: any[],
  ) {
    const transactionItems = "items" in transactions ? transactions.items : transactions;
    const produceItems = "items" in produce ? produce.items : produce;
    return {
      transactions: transactionItems,
      produce: produceItems,
      dailyPrices,
    };
  }

  private transformFinancialData(
    transactions: PaginatedResponse<Transaction> | Transaction[],
  ) {
    const items = "items" in transactions ? transactions.items : transactions;
    return items;
  }

  private transformInspectionData(
    assessments: PaginatedResponse<Produce> | Produce[],
    inspectors: PaginatedResponse<User> | User[],
  ) {
    const assessmentItems = "items" in assessments ? assessments.items : assessments;
    const inspectorItems = "items" in inspectors ? inspectors.items : inspectors;
    return { assessments: assessmentItems, inspectors: inspectorItems };
  }

  private async generatePDF(data: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument();

      doc.on("data", chunks.push.bind(chunks));
      doc.on("end", () => resolve(Buffer.concat(chunks as Uint8Array[])));

      doc.fontSize(16).text("Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(JSON.stringify(data, null, 2));

      doc.end();
    });
  }

  private async generateExcel(data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    // Add headers
    const headers = Object.keys(data[0] || {});
    worksheet.addRow(headers);

    // Add data
    data.forEach((row) => {
      worksheet.addRow(Object.values(row));
    });

    return workbook.xlsx.writeBuffer().then(buffer => Buffer.from(buffer));
  }

  private async generateCSV(data: any): Promise<Buffer> {
    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    return Buffer.from([headers, ...rows].join("\n"));
  }

  async createReport(
    user_id: string,
    type: ReportType,
    format: ReportFormat,
    parameters: any,
  ): Promise<Report> {
    const report = this.reportRepository.create({
      user_id,
      type,
      format,
      parameters,
      status: ReportStatus.QUEUED,
    });

    return this.reportRepository.save(report);
  }

  async getReport(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ["user"],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async getUserReports(user_id: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { user_id },
      relations: ["user"],
      order: { created_at: "DESC" },
    });
  }
}
