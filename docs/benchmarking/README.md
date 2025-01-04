# Benchmarking System Documentation

## Overview
The benchmarking system provides comprehensive performance testing capabilities for the AI inspection service. It includes warmup phases, cooldown periods, detailed metrics collection, and comparative analysis tools.

## Components

### 1. Benchmark Service
- Configurable test scenarios
- Warmup and cooldown phases
- Detailed metrics collection
- Performance analysis tools

### 2. Performance Metrics
- Latency measurements
- Throughput analysis
- Resource utilization
- Error rate tracking

### 3. Analysis Tools
- Comparative analysis
- Trend analysis
- Performance regression detection
- Bottleneck identification

## Configuration

### Benchmark Settings
```typescript
interface BenchmarkConfig {
  name: string;
  description?: string;
  duration: number;
  warmupDuration: number;
  cooldownDuration: number;
  concurrency: number;
  batchSize: number;
  targetRPS: number;
  tags: string[];
}
```

### Metric Collection
```typescript
interface MetricConfig {
  sampleInterval: number;
  aggregationPeriod: number;
  retentionPeriod: number;
  customMetrics: {
    name: string;
    type: 'counter' | 'gauge' | 'histogram';
    labels: string[];
  }[];
}
```

## Usage Examples

### 1. Running a Basic Benchmark
```typescript
const config: BenchmarkConfig = {
  name: 'Basic Performance Test',
  duration: 300000, // 5 minutes
  warmupDuration: 60000, // 1 minute
  cooldownDuration: 30000, // 30 seconds
  concurrency: 5,
  batchSize: 10,
  targetRPS: 100,
  tags: ['production', 'baseline']
};

const result = await benchmarkService.runBenchmark(config);
```

### 2. Comparative Analysis
```typescript
const comparison = await benchmarkService.compareResults({
  baseline: 'benchmark-20240227',
  current: 'benchmark-20240228',
  metrics: ['latency', 'throughput', 'errorRate'],
  threshold: {
    latencyIncrease: 10, // 10% increase threshold
    throughputDecrease: 5, // 5% decrease threshold
    errorRateIncrease: 1 // 1% increase threshold
  }
});
```

### 3. Custom Metric Collection
```typescript
const customMetrics = {
  name: 'Custom Performance Test',
  metrics: [
    {
      name: 'prediction_confidence',
      type: 'histogram',
      labels: ['model_version', 'image_type']
    },
    {
      name: 'preprocessing_time',
      type: 'gauge',
      labels: ['stage']
    }
  ]
};

const result = await benchmarkService.runBenchmarkWithCustomMetrics(config, customMetrics);
```

## Testing

### Unit Tests
```typescript
describe('BenchmarkService', () => {
  it('should execute warmup phase', async () => {
    const config = {
      name: 'Warmup Test',
      duration: 5000,
      warmupDuration: 2000
    };
    
    const result = await benchmarkService.runBenchmark(config);
    expect(result.phases).toContain('warmup');
    expect(result.metrics.warmup.duration).toBe(2000);
  });

  it('should collect custom metrics', async () => {
    const config = {
      name: 'Custom Metrics Test',
      duration: 5000
    };
    
    const customMetrics = {
      name: 'test_metric',
      type: 'counter'
    };
    
    const result = await benchmarkService.runBenchmarkWithCustomMetrics(
      config,
      customMetrics
    );
    
    expect(result.metrics.custom.test_metric).toBeDefined();
  });

  it('should detect performance regression', async () => {
    const baseline = {
      latency: { p95: 100 },
      throughput: 1000,
      errorRate: 0.01
    };
    
    const current = {
      latency: { p95: 120 },
      throughput: 900,
      errorRate: 0.02
    };
    
    const comparison = await benchmarkService.compareResults({
      baseline,
      current,
      threshold: {
        latencyIncrease: 10,
        throughputDecrease: 5,
        errorRateIncrease: 0.5
      }
    });
    
    expect(comparison.hasRegression).toBe(true);
    expect(comparison.regressions).toContain('latency');
  });
});
```

### Integration Tests
```typescript
describe('Benchmark Integration', () => {
  it('should execute complete benchmark workflow', async () => {
    const config = {
      name: 'Integration Test',
      duration: 10000,
      warmupDuration: 2000,
      cooldownDuration: 1000,
      concurrency: 2
    };
    
    // Run benchmark
    const result = await benchmarkService.runBenchmark(config);
    
    // Verify phases
    expect(result.phases).toEqual(['warmup', 'test', 'cooldown']);
    
    // Verify metrics
    expect(result.metrics.latency).toBeDefined();
    expect(result.metrics.throughput).toBeDefined();
    expect(result.metrics.resourceUsage).toBeDefined();
    
    // Verify resource cleanup
    const resources = await getSystemResources();
    expect(resources.connections).toBe(0);
    expect(resources.activeThreads).toBeLessThanOrEqual(
      config.concurrency
    );
  });

  it('should handle error scenarios', async () => {
    const config = {
      name: 'Error Test',
      duration: 5000,
      errorRate: 0.5 // Simulate 50% error rate
    };
    
    const result = await benchmarkService.runBenchmark(config);
    
    // Verify error handling
    expect(result.metrics.errorRate).toBeCloseTo(0.5, 1);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: 'simulated_error'
      })
    );
  });
});
```

## Performance Analysis

### Metrics
1. Latency
   - Average response time
   - Percentiles (p50, p90, p95, p99)
   - Maximum latency
   - Latency distribution

2. Throughput
   - Requests per second
   - Successful transactions
   - Failed transactions
   - Batch processing rate

3. Resource Usage
   - CPU utilization
   - Memory consumption
   - Network I/O
   - Disk I/O

### Analysis Tools
1. Trend Analysis
   - Historical comparison
   - Regression detection
   - Performance patterns
   - Anomaly detection

2. Resource Analysis
   - Bottleneck identification
   - Resource saturation points
   - Scaling recommendations
   - Optimization opportunities

## Best Practices

### Test Design
1. Benchmark Configuration
   - Use appropriate test duration
   - Include warmup phase
   - Set realistic concurrency
   - Define clear success criteria

2. Load Generation
   - Simulate realistic load patterns
   - Include mixed workloads
   - Consider peak load scenarios
   - Test edge cases

### Result Analysis
1. Data Collection
   - Collect comprehensive metrics
   - Use appropriate sampling rates
   - Store historical results
   - Track environmental factors

2. Interpretation
   - Consider statistical significance
   - Account for external factors
   - Compare similar conditions
   - Document findings

## Security Considerations

### Data Protection
- Secure test data
- Protect benchmark results
- Control access to tools
- Audit benchmark execution

### Resource Protection
- Limit resource consumption
- Prevent DoS scenarios
- Monitor system health
- Implement safeguards

## Troubleshooting

### Common Issues
1. Resource Exhaustion
   - Monitor system resources
   - Implement resource limits
   - Use appropriate scaling
   - Clean up resources

2. Data Consistency
   - Validate test data
   - Check data integrity
   - Handle data corruption
   - Maintain test isolation

3. Performance Issues
   - Identify bottlenecks
   - Debug slow operations
   - Optimize resource usage
   - Monitor system health 