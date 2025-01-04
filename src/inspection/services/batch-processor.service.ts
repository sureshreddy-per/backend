import { Injectable, Logger } from '@nestjs/common';
import { AIAnalysisResult } from '../interfaces/ai-service.interface';
import { AIValidationService } from './ai-validation.service';
import { SystemMonitorService } from './system-monitor.service';
import pLimit from 'p-limit';

interface BatchProcessingOptions {
  concurrency?: number;
  maxBatchSize?: number;
  retryAttempts?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  maxRetryDelay?: number;
  circuitBreaker?: {
    failureThreshold: number;
    resetTimeout: number;
  };
}

interface ProcessingStats {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  totalTime: number;
  averageTime: number;
  retryCount: number;
  circuitBreakerTrips: number;
  errors: Array<{
    message: string;
    count: number;
    lastOccurred: Date;
  }>;
}

@Injectable()
export class BatchProcessorService {
  private readonly logger = new Logger(BatchProcessorService.name);
  private readonly defaultOptions: BatchProcessingOptions = {
    concurrency: 3,
    maxBatchSize: 10,
    retryAttempts: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    maxRetryDelay: 30000,
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 60000,
    },
  };

  private processingStats: ProcessingStats = {
    totalProcessed: 0,
    successCount: 0,
    failureCount: 0,
    totalTime: 0,
    averageTime: 0,
    retryCount: 0,
    circuitBreakerTrips: 0,
    errors: [],
  };

  private errorStats = new Map<string, { count: number; lastOccurred: Date }>();
  private circuitBreakerState = {
    isOpen: false,
    failures: 0,
    lastFailure: null as Date | null,
  };

  constructor(
    private readonly validationService: AIValidationService,
    private readonly systemMonitor: SystemMonitorService,
  ) {}

  async processWithChunking<T>(
    items: T[],
    processor: (chunk: T[]) => Promise<AIAnalysisResult[]>,
    options: BatchProcessingOptions = {},
  ): Promise<{
    results: AIAnalysisResult[];
    failed: T[];
    stats: ProcessingStats;
  }> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const chunks = this.chunkArray(items, mergedOptions.maxBatchSize || 10);
    const results: AIAnalysisResult[] = [];
    const failed: T[] = [];
    const startTime = Date.now();

    const limit = pLimit(mergedOptions.concurrency || 3);

    try {
      await Promise.all(
        chunks.map((chunk) =>
          limit(async () => {
            try {
              if (this.circuitBreakerState.isOpen) {
                throw new Error('Circuit breaker is open');
              }

              const chunkResults = await this.processChunkWithRetry(
                chunk,
                processor,
                mergedOptions,
              );
              results.push(...chunkResults);
              this.updateStats(true, Date.now() - startTime);
            } catch (error) {
              failed.push(...chunk);
              this.updateStats(false, Date.now() - startTime);
              this.updateErrorStats(error);
              this.updateCircuitBreaker(mergedOptions);
            }
          }),
        ),
      );

      return { results, failed, stats: this.getStats() };
    } catch (error) {
      this.logger.error('Batch processing failed:', error.stack);
      throw error;
    }
  }

  private async processChunkWithRetry<T>(
    chunk: T[],
    processor: (chunk: T[]) => Promise<AIAnalysisResult[]>,
    options: BatchProcessingOptions,
  ): Promise<AIAnalysisResult[]> {
    let lastError: Error;
    let delay = options.retryDelay || 1000;

    for (let attempt = 0; attempt <= (options.retryAttempts || 3); attempt++) {
      try {
        if (attempt > 0) {
          this.processingStats.retryCount++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          if (options.exponentialBackoff) {
            delay = Math.min(
              delay * 2,
              options.maxRetryDelay || 30000,
            );
          }
        }

        const results = await processor(chunk);
        if (!this.validateResults(results)) {
          throw new Error('Validation failed for processed results');
        }
        return results;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Processing attempt ${attempt + 1} failed: ${error.message}`,
        );
      }
    }

    throw lastError;
  }

  private validateResults(results: AIAnalysisResult[]): boolean {
    return results.every((result) =>
      this.validationService.validateAnalysisResult(result, {
        minConfidence: 0.7,
        minPredictions: 1,
      }).isValid,
    );
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private updateStats(success: boolean, processingTime: number): void {
    this.processingStats.totalProcessed++;
    this.processingStats.totalTime += processingTime;
    this.processingStats.averageTime =
      this.processingStats.totalTime / this.processingStats.totalProcessed;

    if (success) {
      this.processingStats.successCount++;
    } else {
      this.processingStats.failureCount++;
    }
  }

  private updateErrorStats(error: Error): void {
    const stats = this.errorStats.get(error.message) || {
      count: 0,
      lastOccurred: new Date(),
    };
    stats.count++;
    stats.lastOccurred = new Date();
    this.errorStats.set(error.message, stats);

    this.processingStats.errors.push({
      message: error.message,
      count: stats.count,
      lastOccurred: stats.lastOccurred,
    });

    if (this.processingStats.errors.length > 100) {
      this.processingStats.errors.shift();
    }
  }

  private updateCircuitBreaker(options: BatchProcessingOptions): void {
    this.circuitBreakerState.failures++;
    this.circuitBreakerState.lastFailure = new Date();

    if (
      this.circuitBreakerState.failures >=
      (options.circuitBreaker?.failureThreshold || 5)
    ) {
      if (!this.circuitBreakerState.isOpen) {
        this.circuitBreakerState.isOpen = true;
        this.processingStats.circuitBreakerTrips++;
        this.logger.warn('Circuit breaker opened');

        setTimeout(() => {
          this.circuitBreakerState.isOpen = false;
          this.circuitBreakerState.failures = 0;
          this.logger.log('Circuit breaker reset');
        }, options.circuitBreaker?.resetTimeout || 60000);
      }
    }
  }

  getStats(): ProcessingStats {
    return { ...this.processingStats };
  }

  getMetrics(): { [key: string]: number } {
    return {
      successRate: this.processingStats.successCount / this.processingStats.totalProcessed,
      averageProcessingTime: this.processingStats.averageTime,
      errorRate: this.processingStats.failureCount / this.processingStats.totalProcessed,
      retryRate: this.processingStats.retryCount / this.processingStats.totalProcessed,
    };
  }

  getErrorStats() {
    return {
      total: this.processingStats.failureCount,
      unique: this.errorStats.size,
      frequent: Array.from(this.errorStats.entries())
        .filter(([_, stats]) => stats.count >= 5)
        .map(([message, stats]) => ({
          message,
          count: stats.count,
          lastOccurred: stats.lastOccurred,
        })),
      recent: this.processingStats.errors.slice(0, 10),
    };
  }

  getCurrentConfig() {
    return {
      circuitBreaker: {
        isOpen: this.circuitBreakerState.isOpen,
        failures: this.circuitBreakerState.failures,
        lastFailure: this.circuitBreakerState.lastFailure,
      },
      recommendedConcurrency: this.systemMonitor.getRecommendedConcurrency(),
    };
  }
} 