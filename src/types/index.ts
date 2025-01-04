export interface TestResult {
  success: boolean;
  error?: {
    message: string;
    category: string;
  };
  data?: any;
}

export interface ProcessingMetrics {
  totalProcessed: number;
  successRate: number;
  averageProcessingTime: number;
  errorCategories: Record<string, number>;
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
}

export interface BatchProcessorConfig {
  maxRetries: number;
  retryDelay: number;
  concurrencyLimit: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
} 