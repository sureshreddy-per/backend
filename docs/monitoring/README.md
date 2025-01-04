# Monitoring System Documentation

## Overview
The monitoring system provides comprehensive real-time monitoring, alerting, and performance benchmarking capabilities for the AI inspection service. It includes system metrics collection, performance tracking, error monitoring, and configurable alerts.

## Components

### 1. System Monitoring
- Real-time system metrics collection
- Resource utilization tracking
- Adaptive concurrency management
- Health status reporting

### 2. Alerting System
- Configurable alert rules
- Multi-level alerting (info, warning, error, critical)
- Alert acknowledgment workflow
- Alert history management

### 3. Performance Benchmarking
- Customizable benchmark scenarios
- Detailed performance metrics
- Resource usage analysis
- Benchmark comparison tools

### 4. Error Tracking
- Detailed error logging
- Error pattern analysis
- Error rate monitoring
- Error history management

## API Endpoints

### System Health and Metrics
```typescript
GET /monitoring/health
GET /monitoring/metrics?duration={milliseconds}
GET /monitoring/performance
GET /monitoring/errors
GET /monitoring/config
```

### Alerts Management
```typescript
GET /monitoring/alerts
PUT /monitoring/alerts/:id/acknowledge
GET /monitoring/alerts/rules
POST /monitoring/alerts/rules
PUT /monitoring/alerts/rules/:id
DELETE /monitoring/alerts/rules/:id
```

### Benchmarking
```typescript
POST /monitoring/benchmark
GET /monitoring/benchmark
GET /monitoring/benchmark/:id
GET /monitoring/benchmark/latest
GET /monitoring/benchmark/compare?id1={benchmarkId1}&id2={benchmarkId2}
```

## Usage Examples

### 1. System Health Check
```typescript
const response = await axios.get('/monitoring/health');
// Response:
{
  status: 'healthy' | 'degraded' | 'critical',
  metrics: {
    cpuUsage: 0.45,
    memoryUsage: 0.6,
    loadAverage: 2.5,
    activeProcesses: 8,
    timestamp: '2024-02-28T12:00:00Z'
  },
  recommendations: [
    'Moderate CPU load. Monitor for further increases.'
  ]
}
```

### 2. Creating Alert Rules
```typescript
const newRule = {
  name: 'High Memory Usage',
  condition: 'memoryUsage',
  threshold: 0.85,
  type: 'warning',
  source: 'system',
  message: 'Memory usage is approaching critical levels',
  enabled: true,
  cooldown: 300000
};

const response = await axios.post('/monitoring/alerts/rules', newRule);
```

### 3. Running Benchmarks
```typescript
const benchmarkConfig = {
  name: 'AI Processing Performance Test',
  duration: 60000, // 1 minute
  concurrency: 5,
  batchSize: 10,
  warmup: true,
  cooldown: true
};

const response = await axios.post('/monitoring/benchmark', benchmarkConfig);
```

### 4. Comparing Benchmark Results
```typescript
const response = await axios.get('/monitoring/benchmark/compare', {
  params: {
    id1: 'benchmark-1709123456789',
    id2: 'benchmark-1709123498765'
  }
});
```

## Best Practices

### Alert Rule Configuration
1. Set appropriate thresholds based on system capacity
2. Configure cooldown periods to prevent alert storms
3. Use different alert levels appropriately
4. Keep alert messages clear and actionable

### Benchmark Execution
1. Run benchmarks during low-traffic periods
2. Use warmup phase for accurate results
3. Include cooldown phase for system stability
4. Test with realistic data volumes

### Performance Monitoring
1. Monitor trends over time
2. Set up alerts for anomalies
3. Track resource utilization patterns
4. Analyze error rates and patterns

## Error Handling

### Common Error Scenarios
```typescript
// Alert rule not found
{
  statusCode: 404,
  message: 'Rule {ruleId} not found',
  error: 'Not Found'
}

// Invalid benchmark configuration
{
  statusCode: 400,
  message: 'Invalid benchmark configuration: duration must be positive',
  error: 'Bad Request'
}

// Concurrent benchmark execution
{
  statusCode: 409,
  message: 'Benchmark is already running',
  error: 'Conflict'
}
```

## Testing

### Unit Tests
```typescript
describe('AlertService', () => {
  it('should create new alert rule', async () => {
    const rule = {
      name: 'Test Rule',
      condition: 'cpuUsage',
      threshold: 0.9,
      type: 'critical',
      source: 'system',
      message: 'Test alert',
      enabled: true,
      cooldown: 300000
    };
    
    const result = await alertService.addRule(rule);
    expect(result.id).toBeDefined();
    expect(result.name).toBe(rule.name);
  });
});

describe('BenchmarkService', () => {
  it('should run benchmark with warmup', async () => {
    const config = {
      name: 'Test Benchmark',
      duration: 10000,
      warmup: true
    };
    
    const result = await benchmarkService.runBenchmark(config);
    expect(result.metrics.throughput).toBeGreaterThan(0);
    expect(result.metrics.latency.avg).toBeDefined();
  });
});

describe('SystemMonitorService', () => {
  it('should recommend appropriate concurrency', async () => {
    const metrics = {
      cpuUsage: 0.7,
      memoryUsage: 0.6,
      loadAverage: 4
    };
    
    await systemMonitor.updateMetrics(metrics);
    const concurrency = systemMonitor.getRecommendedConcurrency();
    expect(concurrency).toBeGreaterThanOrEqual(1);
    expect(concurrency).toBeLessThanOrEqual(os.cpus().length * 2);
  });
});
```

### Integration Tests
```typescript
describe('Monitoring Integration', () => {
  it('should track system metrics and trigger alerts', async () => {
    // Setup high CPU usage simulation
    const highCpuMetrics = {
      cpuUsage: 0.95,
      memoryUsage: 0.5,
      loadAverage: 8
    };

    // Update metrics
    await systemMonitor.updateMetrics(highCpuMetrics);

    // Wait for alert processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check alerts
    const alerts = await alertService.getAlerts({
      type: 'critical',
      source: 'system'
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('CPU usage');
  });

  it('should execute benchmark and collect metrics', async () => {
    const config = {
      name: 'Integration Test Benchmark',
      duration: 5000,
      concurrency: 2,
      batchSize: 5
    };

    // Run benchmark
    const result = await benchmarkService.runBenchmark(config);

    // Verify metrics collection
    expect(result.metrics).toBeDefined();
    expect(result.metrics.resourceUsage).toBeDefined();
    expect(result.metrics.latency).toBeDefined();

    // Verify system metrics were collected
    const systemMetrics = await systemMonitor.getMetrics(5000);
    expect(systemMetrics).toHaveLength.greaterThan(0);
  });
});
```

## Performance Considerations

### Resource Usage
- Monitor memory usage during benchmark execution
- Implement circuit breakers for system protection
- Use adaptive concurrency based on system load
- Implement metric data retention policies

### Scalability
- Configure appropriate batch sizes
- Optimize alert rule evaluation
- Implement efficient metric storage
- Use appropriate indexing for historical data

## Security Considerations

### Access Control
- Implement role-based access for monitoring endpoints
- Restrict alert rule modifications
- Protect sensitive metric data
- Validate benchmark configurations

### Data Protection
- Sanitize error messages
- Protect sensitive metrics
- Implement rate limiting
- Secure WebSocket connections 