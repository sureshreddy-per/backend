import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SystemMonitorService } from '../services/system-monitor.service';
import { BatchProcessorService } from '../services/batch-processor.service';
import { TensorFlowAIService } from '../services/tensorflow-ai.service';
import { AlertService } from '../services/alert.service';
import { BenchmarkService, BenchmarkConfig } from '../services/benchmark.service';
import { Alert } from '../services/alert.service';
import { SystemMetrics } from '../services/system-monitor.service';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly systemMonitor: SystemMonitorService,
    private readonly batchProcessor: BatchProcessorService,
    private readonly aiService: TensorFlowAIService,
    private readonly alertService: AlertService,
    private readonly benchmarkService: BenchmarkService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  getHealth() {
    return this.systemMonitor.getSystemHealth();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics' })
  getMetrics(@Query('duration') duration?: number): Promise<SystemMetrics[]> {
    return Promise.resolve(this.systemMonitor.getMetrics(duration));
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance statistics' })
  getPerformanceStats(): Record<string, any> {
    return this.batchProcessor.getStats();
  }

  @Get('errors')
  @ApiOperation({ summary: 'Get error statistics' })
  getErrorStats(): Record<string, any> {
    return this.aiService.getErrorStats();
  }

  @Get('config')
  @ApiOperation({ summary: 'Get current configuration' })
  getCurrentConfig(): Record<string, any> {
    return {
      ai: this.aiService.getCurrentConfig(),
      batchProcessor: this.batchProcessor.getCurrentConfig(),
      systemMonitor: this.systemMonitor.getCurrentMetrics(),
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get system alerts' })
  getAlerts(
    @Query('type') type?: Alert['type'],
    @Query('source') source?: string,
    @Query('acknowledged') acknowledged?: boolean,
    @Query('limit') limit?: number,
    @Query('since') since?: Date,
  ): Promise<Alert[]> {
    return Promise.resolve(this.alertService.getAlerts({ type, source, acknowledged, limit, since }));
  }

  @Post('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  acknowledgeAlert(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<Alert> {
    return Promise.resolve(this.alertService.acknowledgeAlert(id, userId));
  }

  @Get('alerts/rules')
  @ApiOperation({ summary: 'Get alert rules' })
  getAlertRules() {
    return this.alertService.getRules();
  }

  @Post('benchmark')
  @ApiOperation({ summary: 'Run a benchmark' })
  runBenchmark(@Body() config: BenchmarkConfig): Promise<Record<string, any>> {
    return this.benchmarkService.runBenchmark(config);
  }

  @Get('benchmarks')
  @ApiOperation({ summary: 'Get benchmark results' })
  getBenchmarks(@Query('limit') limit?: number): Promise<Record<string, any>[]> {
    return Promise.resolve(this.benchmarkService.getBenchmarks(limit));
  }

  @Get('benchmarks/:id')
  @ApiOperation({ summary: 'Get a specific benchmark result' })
  getBenchmark(@Param('id') id: string): Promise<Record<string, any>> {
    return Promise.resolve(this.benchmarkService.getBenchmark(id));
  }

  @Get('benchmarks/latest')
  @ApiOperation({ summary: 'Get the latest benchmark result' })
  getLatestBenchmark(): Promise<Record<string, any>> {
    return Promise.resolve(this.benchmarkService.getLatestBenchmark());
  }

  @Get('benchmarks/compare')
  @ApiOperation({ summary: 'Compare two benchmark results' })
  compareBenchmarks(
    @Query('id1') id1: string,
    @Query('id2') id2: string,
  ): Promise<Record<string, any>> {
    return Promise.resolve(this.benchmarkService.compareBenchmarks(id1, id2));
  }
} 