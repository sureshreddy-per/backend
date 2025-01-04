import { CircuitBreakerError, ProcessingError } from '../errors';

interface BatchProcessorConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  failureThreshold: number;
  resetTimeoutMs: number;
}

interface CircuitBreakerState {
  state: 'OPEN' | 'CLOSED' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: Date;
  resetTimeout: number;
}

interface ProcessResult<R> {
  success: boolean;
  result?: R;
  error?: any;
  retryable?: boolean;
}

export class BatchProcessorService {
  private circuitBreaker: CircuitBreakerState;
  private metrics: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    processingTimes: number[];
    errorCategories: Record<string, number>;
  };
  private currentConcurrency: number;
  private readonly maxConcurrency: number;
  private readonly minConcurrency: number;
  private readonly cpuThreshold: number;
  private readonly memoryThreshold: number;

  constructor(private config: BatchProcessorConfig) {
    this.circuitBreaker = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: new Date(),
      resetTimeout: config.resetTimeoutMs
    };
    this.metrics = {
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      processingTimes: [],
      errorCategories: {}
    };
    this.currentConcurrency = 5; // Default concurrency
    this.maxConcurrency = 10;
    this.minConcurrency = 1;
    this.cpuThreshold = 0.8; // 80% CPU usage threshold
    this.memoryThreshold = 0.8; // 80% memory usage threshold
  }

  async process<T, R>({
    data,
    processFn,
    errorHandler
  }: {
    data: T;
    processFn: (data: T) => Promise<R>;
    errorHandler?: (error: Error) => { retryable: boolean; category: string; error: Error };
  }): Promise<ProcessResult<R>> {
    if (this.isCircuitOpen()) {
      throw new CircuitBreakerError('Circuit breaker is open', {
        state: this.circuitBreaker.state,
        failureCount: this.circuitBreaker.failureCount,
        lastFailureTime: this.circuitBreaker.lastFailureTime.toISOString(),
        resetTimeout: this.circuitBreaker.resetTimeout
      });
    }

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.config.maxAttempts) {
      try {
        const startTime = Date.now();
        const result = await processFn(data);
        this.recordSuccess(Date.now() - startTime);
        return { success: true, result };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (errorHandler) {
          const handled = errorHandler(lastError);
          if (!handled.retryable) {
            this.recordError(handled.category);
            return { success: false, error: handled.error, retryable: false };
          }
        }

        if (error instanceof ProcessingError && !error.retryable) {
          this.recordError('non_retryable');
          return { success: false, error, retryable: false };
        }

        attempt++;
        if (attempt < this.config.maxAttempts) {
          await this.delay(attempt);
        }
      }
    }

    this.recordFailure();
    return { success: false, error: new Error('Maximum retry attempts exceeded'), retryable: false };
  }

  async processBatch<T, R>({
    items,
    processFn,
    concurrency = this.currentConcurrency
  }: {
    items: T[];
    processFn: (item: T) => Promise<R>;
    concurrency?: number;
  }): Promise<Array<ProcessResult<R>>> {
    this.adjustConcurrency();
    const actualConcurrency = Math.min(concurrency, this.currentConcurrency);
    
    const results: Array<ProcessResult<R>> = [];
    const batches = this.splitIntoBatches(items, actualConcurrency);

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(item => this.process({ data: item, processFn }).catch(error => ({
          success: false,
          error,
          retryable: false
        })))
      );
      results.push(...batchResults);
    }

    return results;
  }

  private splitIntoBatches<T>(items: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }

  private async delay(attempt: number): Promise<void> {
    const delay = Math.min(
      this.config.initialDelayMs * Math.pow(this.config.backoffFactor, attempt - 1),
      this.config.maxDelayMs
    );
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private isCircuitOpen(): boolean {
    if (this.circuitBreaker.state === 'CLOSED') {
      return false;
    }

    if (this.circuitBreaker.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime.getTime();
      if (timeSinceLastFailure >= this.circuitBreaker.resetTimeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }

    return false;
  }

  private recordSuccess(processingTime: number): void {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failureCount = 0;
    }
    this.metrics.totalProcessed++;
    this.metrics.successCount++;
    this.metrics.processingTimes.push(processingTime);
  }

  private recordError(category: string = 'unknown'): void {
    this.metrics.totalProcessed++;
    this.metrics.errorCount++;
    this.metrics.errorCategories[category] = (this.metrics.errorCategories[category] || 0) + 1;
  }

  private recordFailure(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = new Date();

    if (this.circuitBreaker.failureCount >= this.config.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
    }
  }

  private adjustConcurrency(): void {
    const cpuUsage = this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();

    if (cpuUsage > this.cpuThreshold || memoryUsage > this.memoryThreshold) {
      // Reduce concurrency by 50% but not below minimum
      this.currentConcurrency = Math.max(
        this.minConcurrency,
        Math.floor(this.currentConcurrency * 0.5)
      );
    } else if (cpuUsage < this.cpuThreshold / 2 && memoryUsage < this.memoryThreshold / 2) {
      // Increase concurrency by 25% but not above maximum
      this.currentConcurrency = Math.min(
        this.maxConcurrency,
        Math.ceil(this.currentConcurrency * 1.25)
      );
    }
  }

  private getCPUUsage(): number {
    const cpuUsage = process.cpuUsage();
    return (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
  }

  private getMemoryUsage(): number {
    const memUsage = process.memoryUsage();
    return memUsage.heapUsed / memUsage.heapTotal;
  }

  getCircuitStatus(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  getCurrentConcurrency(): number {
    return this.currentConcurrency;
  }

  getMetrics() {
    return {
      totalProcessed: this.metrics.totalProcessed,
      successCount: this.metrics.successCount,
      errorCount: this.metrics.errorCount,
      successRate: (this.metrics.successCount / this.metrics.totalProcessed) * 100,
      averageProcessingTime: this.metrics.processingTimes.reduce((a, b) => a + b, 0) / this.metrics.processingTimes.length
    };
  }

  getErrorStats() {
    return {
      totalErrors: this.metrics.errorCount,
      errorCategories: { ...this.metrics.errorCategories }
    };
  }

  getResourceUsage() {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      activeWorkers: this.currentConcurrency
    };
  }
} 