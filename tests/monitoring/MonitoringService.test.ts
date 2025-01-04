import { SystemMonitorService, SystemMetrics } from '../../src/inspection/services/system-monitor.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as os from 'os';

// Mock os module
jest.mock('os', () => ({
  cpus: jest.fn().mockReturnValue(Array(4).fill({
    times: {
      user: 100,
      nice: 0,
      sys: 50,
      idle: 150,
      irq: 0
    }
  })),
  totalmem: jest.fn().mockReturnValue(16 * 1024 * 1024 * 1024), // 16GB
  freemem: jest.fn().mockReturnValue(8 * 1024 * 1024 * 1024),   // 8GB
  loadavg: jest.fn().mockReturnValue([1.5, 1.2, 1.0])
}));

// Mock setInterval to execute immediately
jest.useFakeTimers();

describe('SystemMonitorService', () => {
  let monitoringService: SystemMonitorService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    eventEmitter = new EventEmitter2();
    monitoringService = new SystemMonitorService(eventEmitter);
    
    // Initialize the service
    monitoringService.onModuleInit();
    
    // Force initial metrics collection
    const initialMetrics = await monitoringService['collectMetrics']();
    monitoringService['updateMetrics'](initialMetrics);
    
    // Advance timers to allow metrics collection
    jest.advanceTimersByTime(100);
  });

  afterEach(() => {
    monitoringService.onModuleDestroy();
    jest.clearAllTimers();
  });

  describe('System Metrics', () => {
    it('should collect system metrics', async () => {
      const metrics = monitoringService.getCurrentMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.cpuUsage).toBeDefined();
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.loadAverage).toBeDefined();
      expect(metrics.activeProcesses).toBeDefined();
      expect(metrics.timestamp).toBeDefined();
      
      // Verify actual values based on our mocks
      expect(metrics.cpuUsage).toBe(0.5); // (user + sys) / (user + nice + sys + idle + irq)
      expect(metrics.memoryUsage).toBe(0.5); // (total - free) / total
      expect(metrics.loadAverage).toBe(1.5);
    });

    it('should maintain metrics history', async () => {
      // Collect multiple metrics
      for (let i = 0; i < 3; i++) {
        const metrics = await monitoringService['collectMetrics']();
        monitoringService['updateMetrics'](metrics);
        jest.advanceTimersByTime(5000);
      }
      
      const metrics = monitoringService.getMetrics();
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      
      const latestMetric = metrics[metrics.length - 1];
      expect(latestMetric.cpuUsage).toBeDefined();
      expect(latestMetric.memoryUsage).toBeDefined();
      expect(latestMetric.loadAverage).toBeDefined();
      expect(latestMetric.activeProcesses).toBeDefined();
      expect(latestMetric.timestamp).toBeDefined();
    });

    it('should get metrics for specific duration', async () => {
      // Collect metrics over time
      const timestamps: number[] = [];
      for (let i = 0; i < 3; i++) {
        const metrics = await monitoringService['collectMetrics']();
        metrics.timestamp = Date.now();
        timestamps.push(metrics.timestamp);
        monitoringService['updateMetrics'](metrics);
        jest.advanceTimersByTime(5000);
      }
      
      const duration = 10000; // 10 seconds
      const metrics = monitoringService.getMetrics(duration);
      
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      
      const cutoffTime = timestamps[timestamps.length - 1] - duration;
      metrics.forEach(metric => {
        expect(metric.timestamp).toBeGreaterThan(cutoffTime);
      });
    });

    it('should emit metrics updates', (done) => {
      eventEmitter.once('system.metrics.updated', (metrics) => {
        expect(metrics).toBeDefined();
        expect(metrics.cpuUsage).toBeDefined();
        expect(metrics.memoryUsage).toBeDefined();
        expect(metrics.loadAverage).toBeDefined();
        expect(metrics.activeProcesses).toBeDefined();
        expect(metrics.timestamp).toBeDefined();
        done();
      });

      // Trigger next metrics update
      jest.advanceTimersByTime(5000);
    });

    it('should provide system health status', async () => {
      const health = monitoringService.getSystemHealth();
      
      expect(health).toHaveProperty('status');
      expect(['healthy', 'degraded', 'critical']).toContain(health.status);
      expect(health.metrics).toBeDefined();
      expect(health.recommendations).toBeDefined();
      expect(Array.isArray(health.recommendations)).toBe(true);
      
      // With our mock values (CPU: 50%, Memory: 50%, Load: 1.5), system should be healthy
      expect(health.status).toBe('healthy');
      expect(health.recommendations).toHaveLength(0);
    });

    it('should recommend concurrency based on system load', async () => {
      // Update mock CPU values to simulate lower load
      (os.cpus as jest.Mock).mockReturnValueOnce(Array(4).fill({
        times: {
          user: 30,
          nice: 0,
          sys: 20,
          idle: 150,
          irq: 0
        }
      }));

      // Mock metrics with lower load
      const metrics: SystemMetrics = {
        cpuUsage: 0.25,
        memoryUsage: 0.5,
        loadAverage: 1.5,
        activeProcesses: 1,
        timestamp: Date.now()
      };

      monitoringService['metrics'] = [metrics];
      const concurrency = monitoringService.getRecommendedConcurrency();
      expect(concurrency).toBeGreaterThan(1);
      expect(concurrency).toBeLessThanOrEqual(8); // Max should be 2x CPU cores
    });

    it('should handle high system load', async () => {
      // Simulate high system load
      const highLoadMetrics = {
        cpuUsage: 0.9,
        memoryUsage: 0.85,
        loadAverage: 8,
        activeProcesses: 1,
        timestamp: Date.now()
      };

      // Update metrics with high load
      monitoringService['updateMetrics'](highLoadMetrics);
      
      const health = monitoringService.getSystemHealth();
      expect(health.status).toBe('critical');
      expect(health.recommendations.length).toBeGreaterThan(0);
      expect(health.recommendations).toContain('High CPU usage detected. Consider reducing batch sizes.');
      expect(health.recommendations).toContain('High memory usage detected. Consider garbage collection.');
      expect(health.recommendations).toContain('System overloaded. Reduce concurrent operations.');
      
      const concurrency = monitoringService.getRecommendedConcurrency();
      expect(concurrency).toBe(1); // Should recommend minimum concurrency under high load
    });
  });
});
