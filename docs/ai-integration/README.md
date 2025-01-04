# AI Integration Documentation

## Overview
The AI integration module provides robust validation, retry mechanisms, and performance optimizations for AI-powered inspections. It includes secure URL validation, image dimension checks, prediction validation, and an advanced retry system with exponential backoff.

## Components

### 1. AI Validation Service
- Secure URL validation
- Image dimension and format validation
- Prediction confidence validation
- Input data sanitization

### 2. Batch Processor Service
- Exponential backoff retry mechanism
- Circuit breaker pattern
- Adaptive concurrency control
- Batch size optimization

### 3. Error Handling
- Detailed error classification
- Retry policy management
- Error recovery strategies
- Failure analysis

## Validation Rules

### URL Validation
```typescript
interface URLValidationRules {
  allowedProtocols: ['https'];
  maxLength: 2048;
  allowedDomains: string[];
  blockedPatterns: RegExp[];
}
```

### Image Validation
```typescript
interface ImageValidationRules {
  minWidth: 100;
  maxWidth: 4096;
  minHeight: 100;
  maxHeight: 4096;
  allowedFormats: ['jpg', 'jpeg', 'png'];
  maxSizeBytes: 10485760; // 10MB
}
```

### Prediction Validation
```typescript
interface PredictionValidationRules {
  minConfidence: 0.6;
  requiredFields: string[];
  maxPredictions: 100;
  timeoutMs: 30000;
}
```

## Retry Mechanism

### Configuration
```typescript
interface RetryConfig {
  maxAttempts: 3;
  initialDelayMs: 1000;
  maxDelayMs: 10000;
  backoffFactor: 2;
  jitterMs: 100;
}
```

### Circuit Breaker
```typescript
interface CircuitBreakerConfig {
  failureThreshold: 5;
  resetTimeoutMs: 30000;
  halfOpenMaxCalls: 3;
  monitoringPeriodMs: 60000;
}
```

## Usage Examples

### 1. Validating Image Input
```typescript
const imageValidation = {
  url: 'https://example.com/image.jpg',
  metadata: {
    width: 800,
    height: 600,
    format: 'jpg',
    sizeBytes: 524288
  }
};

const result = await aiValidationService.validateImage(imageValidation);
// Returns validation result or throws ValidationError
```

### 2. Processing with Retry
```typescript
const processingRequest = {
  images: ['image1.jpg', 'image2.jpg'],
  batchSize: 2,
  retryConfig: {
    maxAttempts: 3,
    initialDelayMs: 1000
  }
};

const result = await batchProcessorService.process(processingRequest);
```

### 3. Circuit Breaker Status
```typescript
const status = await batchProcessorService.getCircuitStatus();
// Returns:
{
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
  failureCount: 2,
  lastFailureTime: '2024-02-28T12:00:00Z',
  remainingTimeoutMs: 15000
}
```

## Testing

### Unit Tests
```typescript
describe('AIValidationService', () => {
  it('should validate image dimensions', async () => {
    const image = {
      width: 800,
      height: 600,
      format: 'jpg'
    };
    
    const result = await aiValidationService.validateDimensions(image);
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid image format', async () => {
    const image = {
      width: 800,
      height: 600,
      format: 'gif'
    };
    
    await expect(
      aiValidationService.validateDimensions(image)
    ).rejects.toThrow('Unsupported image format');
  });
});

describe('BatchProcessorService', () => {
  it('should implement exponential backoff', async () => {
    const startTime = Date.now();
    const request = {
      data: 'test',
      maxAttempts: 3
    };
    
    // Mock failure responses
    mockProcessing.mockRejectedValueOnce(new Error('Temporary failure'));
    mockProcessing.mockRejectedValueOnce(new Error('Temporary failure'));
    mockProcessing.mockResolvedValueOnce({ success: true });
    
    const result = await batchProcessorService.process(request);
    const duration = Date.now() - startTime;
    
    expect(result.success).toBe(true);
    expect(duration).toBeGreaterThanOrEqual(3000); // Initial + 1st backoff
  });

  it('should trigger circuit breaker', async () => {
    // Generate failures
    for (let i = 0; i < 5; i++) {
      await expect(
        batchProcessorService.process({ data: 'test' })
      ).rejects.toThrow();
    }
    
    // Verify circuit breaker is open
    const status = await batchProcessorService.getCircuitStatus();
    expect(status.state).toBe('OPEN');
  });
});
```

### Integration Tests
```typescript
describe('AI Integration', () => {
  it('should handle complete processing flow', async () => {
    const request = {
      images: [
        {
          url: 'https://example.com/test1.jpg',
          metadata: {
            width: 800,
            height: 600,
            format: 'jpg'
          }
        }
      ],
      batchSize: 1
    };
    
    // Process request
    const result = await aiIntegrationService.processImages(request);
    
    // Verify results
    expect(result.success).toBe(true);
    expect(result.predictions).toHaveLength(1);
    expect(result.metrics.processingTime).toBeDefined();
  });

  it('should handle validation and retry flow', async () => {
    const invalidRequest = {
      images: [
        {
          url: 'https://example.com/large.jpg',
          metadata: {
            width: 8000, // Too large
            height: 6000,
            format: 'jpg'
          }
        }
      ]
    };
    
    // Attempt processing
    await expect(
      aiIntegrationService.processImages(invalidRequest)
    ).rejects.toThrow('Image dimensions exceed maximum allowed');
    
    // Verify validation error is logged
    const logs = await getProcessingLogs();
    expect(logs).toContainEqual(
      expect.objectContaining({
        level: 'error',
        message: expect.stringContaining('validation failed')
      })
    );
  });
});
```

## Error Handling

### Common Error Types
```typescript
// Validation Errors
class ImageValidationError extends Error {
  constructor(message: string, public details: ValidationDetails) {
    super(message);
  }
}

// Processing Errors
class ProcessingError extends Error {
  constructor(message: string, public retryable: boolean) {
    super(message);
  }
}

// Circuit Breaker Errors
class CircuitBreakerError extends Error {
  constructor(message: string, public status: CircuitStatus) {
    super(message);
  }
}
```

### Error Recovery Strategies
1. Validation Errors
   - Return detailed validation feedback
   - Provide correction suggestions
   - Log validation failures for analysis

2. Processing Errors
   - Implement exponential backoff
   - Use circuit breaker for protection
   - Monitor error patterns

3. System Errors
   - Graceful degradation
   - Fallback mechanisms
   - Alert notifications

## Performance Optimization

### Batch Processing
- Dynamic batch size adjustment
- Parallel processing capabilities
- Resource-aware scheduling
- Queue management

### Caching
- Prediction result caching
- Validation result caching
- Metadata caching
- Cache invalidation strategies

### Resource Management
- Memory usage optimization
- Connection pooling
- Thread pool management
- Resource cleanup

## Security Considerations

### Input Validation
- Strict URL validation
- File type verification
- Size limit enforcement
- Content validation

### Data Protection
- Secure data transmission
- Result encryption
- Access control
- Audit logging

### Error Messages
- Sanitized error responses
- No sensitive data in logs
- Structured error format
- Error tracking 