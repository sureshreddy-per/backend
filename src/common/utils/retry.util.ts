import { Logger } from '@nestjs/common';

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const defaultOptions: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000,    // 10 seconds
  backoffFactor: 2,
};

export function retry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  logger: Logger,
  operationName: string,
): Promise<T> {
  const retryOptions = { ...defaultOptions, ...options };
  let attempt = 1;
  let delay = retryOptions.initialDelay;

  const executeWithRetry = async (): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= retryOptions.maxAttempts) {
        logger.error(
          `${operationName} failed after ${attempt} attempts: ${error.message}`,
          error.stack,
        );
        throw error;
      }

      logger.warn(
        `${operationName} failed (attempt ${attempt}/${retryOptions.maxAttempts}): ${error.message}. Retrying in ${delay}ms...`,
      );

      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
      delay = Math.min(
        delay * retryOptions.backoffFactor,
        retryOptions.maxDelay,
      );

      return executeWithRetry();
    }
  };

  return executeWithRetry();
} 