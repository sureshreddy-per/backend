import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemMonitorService } from './system-monitor.service';
import { TensorFlowAIService } from './tensorflow-ai.service';
import { BatchProcessorService } from './batch-processor.service';
import * as os from 'os';

interface BenchmarkResult {
  id: string;
  name: string;
  timestamp: Date;
  duration: number;
  metrics: {
    throughput: number;
    latency: {
      min: number;
      max: number;
      avg: number;
      p95: number;
      p99: number;
    };
    errorRate: number;
    resourceUsage: {
      cpuUsage: number;
      memoryUsage: number;
      loadAverage: number;
    };
  };
  context?: any;
}

export interface BenchmarkConfig {
  name: string;
  duration?: number;
  concurrency?: number;
  batchSize?: number;
  warmup?: boolean;
  cooldown?: boolean;
}

@Injectable()
export class BenchmarkService {
  private readonly logger = new Logger(BenchmarkService.name);
  private benchmarks: BenchmarkResult[] = [];
  private isRunning = false;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly systemMonitor: SystemMonitorService,
    private readonly aiService: TensorFlowAIService,
    private readonly batchProcessor: BatchProcessorService,
  ) {}

  async measure<T>(operation: () => Promise<T>): Promise<{ duration: number; value: T }> {
    const start = Date.now();
    const value = await operation();
    const duration = Date.now() - start;
    return { duration, value };
  }

  getMemoryUsage(): { heapUsed: number; heapTotal: number } {
    const memoryUsage = process.memoryUsage();
    return {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
    };
  }

  getCPUStats(): { user: number; system: number } {
    const cpuUsage = process.cpuUsage();
    return {
      user: cpuUsage.user,
      system: cpuUsage.system,
    };
  }

  getResourceUsage(): { memory: number; cpu: number } {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    return {
      memory: memoryUsage.heapUsed,
      cpu: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to milliseconds
    };
  }

  async analyze(operation: () => Promise<any>, iterations: number): Promise<{
    iterations: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
  }> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const { duration } = await this.measure(operation);
      times.push(duration);
    }

    return {
      iterations,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
    };
  }

  async compare(implementations: Array<{ name: string; fn: () => Promise<any> }>, iterations: number): Promise<Array<{
    name: string;
    averageTime: number;
    iterations: number;
  }>> {
    const results = await Promise.all(
      implementations.map(async ({ name, fn }) => {
        const analysis = await this.analyze(fn, iterations);
        return {
          name,
          averageTime: analysis.averageTime,
          iterations: analysis.iterations,
        };
      })
    );

    return results;
  }

  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    if (this.isRunning) {
      throw new Error('Benchmark is already running');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const measurements: number[] = [];
    const errors: Error[] = [];

    try {
      // Warmup phase
      if (config.warmup) {
        await this.warmup();
      }

      // Main benchmark phase
      const result = await this.executeBenchmark(config, measurements, errors);

      // Cooldown phase
      if (config.cooldown) {
        await this.cooldown();
      }

      this.benchmarks.push(result);
      this.eventEmitter.emit('benchmark.completed', result);
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  private async warmup(): Promise<void> {
    this.logger.log('Starting warmup phase...');
    // Perform warmup operations
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  private async cooldown(): Promise<void> {
    this.logger.log('Starting cooldown phase...');
    // Allow system to stabilize
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  private async executeBenchmark(
    config: BenchmarkConfig,
    measurements: number[],
    errors: Error[],
  ): Promise<BenchmarkResult> {
    const startTime = Date.now();
    const endTime = startTime + (config.duration || 30000);
    const concurrency = config.concurrency || this.systemMonitor.getRecommendedConcurrency();
    const batchSize = config.batchSize || 10;

    // Generate test data
    const testImages = this.generateTestImages(batchSize);
    
    // Execute benchmark operations
    while (Date.now() < endTime) {
      const batchStartTime = Date.now();
      try {
        const results = await this.aiService.analyzeBatch(testImages, {
          enhanceImage: true,
          detectDefects: true,
        });
        measurements.push(Date.now() - batchStartTime);
      } catch (error) {
        errors.push(error);
      }
    }

    // Calculate metrics
    const duration = Date.now() - startTime;
    const sortedMeasurements = [...measurements].sort((a, b) => a - b);
    const totalOperations = measurements.length * batchSize;

    const metrics = {
      throughput: (totalOperations / duration) * 1000, // operations per second
      latency: {
        min: Math.min(...measurements),
        max: Math.max(...measurements),
        avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
        p95: sortedMeasurements[Math.floor(sortedMeasurements.length * 0.95)],
        p99: sortedMeasurements[Math.floor(sortedMeasurements.length * 0.99)],
      },
      errorRate: errors.length / (measurements.length + errors.length),
      resourceUsage: {
        cpuUsage: this.systemMonitor.getCurrentMetrics()?.cpuUsage || 0,
        memoryUsage: this.systemMonitor.getCurrentMetrics()?.memoryUsage || 0,
        loadAverage: this.systemMonitor.getCurrentMetrics()?.loadAverage || 0,
      },
    };

    return {
      id: `benchmark-${Date.now()}`,
      name: config.name,
      timestamp: new Date(startTime),
      duration,
      metrics,
      context: {
        concurrency,
        batchSize,
        totalOperations,
        errorCount: errors.length,
        configuration: config,
      },
    };
  }

  private generateTestImages(count: number): string[] {
    // In a real implementation, this would generate or return real test image URLs
    return Array(count).fill(0).map((_, i) => 
      `https://example.com/test-image-${i}.jpg`
    );
  }

  getBenchmarks(limit?: number): BenchmarkResult[] {
    const results = [...this.benchmarks];
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? results.slice(0, limit) : results;
  }

  getBenchmark(id: string): BenchmarkResult {
    const benchmark = this.benchmarks.find(b => b.id === id);
    if (!benchmark) {
      throw new Error(`Benchmark ${id} not found`);
    }
    return benchmark;
  }

  getLatestBenchmark(): BenchmarkResult {
    if (this.benchmarks.length === 0) {
      return null;
    }
    return this.benchmarks[this.benchmarks.length - 1];
  }

  compareBenchmarks(id1: string, id2: string): {
    throughputDiff: number;
    latencyDiff: {
      min: number;
      max: number;
      avg: number;
      p95: number;
      p99: number;
    };
    errorRateDiff: number;
    resourceUsageDiff: {
      cpuUsage: number;
      memoryUsage: number;
      loadAverage: number;
    };
  } {
    const b1 = this.getBenchmark(id1);
    const b2 = this.getBenchmark(id2);

    return {
      throughputDiff: b2.metrics.throughput - b1.metrics.throughput,
      latencyDiff: {
        min: b2.metrics.latency.min - b1.metrics.latency.min,
        max: b2.metrics.latency.max - b1.metrics.latency.max,
        avg: b2.metrics.latency.avg - b1.metrics.latency.avg,
        p95: b2.metrics.latency.p95 - b1.metrics.latency.p95,
        p99: b2.metrics.latency.p99 - b1.metrics.latency.p99,
      },
      errorRateDiff: b2.metrics.errorRate - b1.metrics.errorRate,
      resourceUsageDiff: {
        cpuUsage: b2.metrics.resourceUsage.cpuUsage - b1.metrics.resourceUsage.cpuUsage,
        memoryUsage: b2.metrics.resourceUsage.memoryUsage - b1.metrics.resourceUsage.memoryUsage,
        loadAverage: b2.metrics.resourceUsage.loadAverage - b1.metrics.resourceUsage.loadAverage,
      },
    };
  }
} 