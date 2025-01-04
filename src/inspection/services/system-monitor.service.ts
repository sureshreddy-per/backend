import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as os from 'os';

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  loadAverage: number;
  activeProcesses: number;
  timestamp: number;
}

@Injectable()
export class SystemMonitorService implements OnModuleInit {
  private readonly logger = new Logger(SystemMonitorService.name);
  private metrics: SystemMetrics[] = [];
  private readonly maxMetricsHistory = 100;
  private readonly updateInterval = 5000; // 5 seconds
  private intervalId: NodeJS.Timeout;

  constructor(private eventEmitter: EventEmitter2) {}

  onModuleInit() {
    this.startMonitoring();
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private startMonitoring() {
    this.intervalId = setInterval(async () => {
      const metrics = await this.collectMetrics();
      this.updateMetrics(metrics);
      this.eventEmitter.emit('system.metrics.updated', metrics);
    }, this.updateInterval);
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const loadAvg = os.loadavg();

    // Calculate CPU usage
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total);
    }, 0) / cpus.length;

    return {
      cpuUsage: cpuUsage,
      memoryUsage: (totalMem - freeMem) / totalMem,
      loadAverage: loadAvg[0], // 1 minute load average
      activeProcesses: process.pid ? 1 : 0, // In a real app, you'd track actual active processes
      timestamp: Date.now(),
    };
  }

  private updateMetrics(metrics: SystemMetrics) {
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // Log if system is under heavy load
    if (metrics.cpuUsage > 0.8 || metrics.memoryUsage > 0.8 || metrics.loadAverage > os.cpus().length) {
      this.logger.warn('System under heavy load', metrics);
    }
  }

  getRecommendedConcurrency(): number {
    if (this.metrics.length === 0) {
      return 3; // Default concurrency
    }

    const latest = this.metrics[this.metrics.length - 1];
    const cpuCount = os.cpus().length;

    // Calculate base concurrency based on CPU cores and current load
    let concurrency = Math.max(1, Math.floor(cpuCount * (1 - latest.cpuUsage)));

    // Adjust based on memory usage
    if (latest.memoryUsage > 0.8) {
      concurrency = Math.max(1, concurrency - 1);
    }

    // Adjust based on load average
    if (latest.loadAverage > cpuCount) {
      concurrency = Math.max(1, concurrency - 1);
    }

    // Cap maximum concurrency
    const maxConcurrency = cpuCount * 2;
    return Math.min(maxConcurrency, Math.max(1, concurrency));
  }

  getMetrics(duration?: number): SystemMetrics[] {
    if (!duration) {
      return this.metrics;
    }

    const cutoff = Date.now() - duration;
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  getCurrentMetrics(): SystemMetrics {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    metrics: SystemMetrics;
    recommendations: string[];
  } {
    const current = this.getCurrentMetrics();
    if (!current) {
      return {
        status: 'healthy',
        metrics: null,
        recommendations: [],
      };
    }

    const recommendations: string[] = [];
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (current.cpuUsage > 0.8) {
      status = 'critical';
      recommendations.push('High CPU usage detected. Consider reducing batch sizes.');
    } else if (current.cpuUsage > 0.6) {
      status = 'degraded';
      recommendations.push('Moderate CPU load. Monitor for further increases.');
    }

    if (current.memoryUsage > 0.8) {
      status = 'critical';
      recommendations.push('High memory usage detected. Consider garbage collection.');
    } else if (current.memoryUsage > 0.6) {
      status = 'degraded';
      recommendations.push('Moderate memory usage. Monitor for memory leaks.');
    }

    if (current.loadAverage > os.cpus().length) {
      status = 'critical';
      recommendations.push('System overloaded. Reduce concurrent operations.');
    }

    return {
      status,
      metrics: current,
      recommendations,
    };
  }
} 