export class ImageValidationError extends Error {
  constructor(message: string, public details: ValidationDetails) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

export class PredictionValidationError extends Error {
  constructor(message: string, public details: ValidationDetails) {
    super(message);
    this.name = 'PredictionValidationError';
  }
}

export class ProcessingError extends Error {
  constructor(message: string, public retryable: boolean) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export class CircuitBreakerError extends Error {
  constructor(message: string, public status: CircuitStatus) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export interface ValidationDetails {
  field?: string;
  constraint?: string;
  value?: any;
  reason?: string;
}

export interface CircuitStatus {
  state: 'OPEN' | 'CLOSED' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: string;
  resetTimeout: number;
} 