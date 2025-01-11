export class MetricService {
  private metrics: Map<string, number[]>;
  private customMetrics: Map<string, any>;
  private retentionPeriod: number;

  constructor(retentionPeriod: number = 24 * 60 * 60 * 1000) {
    // 24 hours default
    this.metrics = new Map();
    this.customMetrics = new Map();
    this.retentionPeriod = retentionPeriod;
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)?.push(value);
    this.cleanup(name);
  }

  getMetric(name: string): number[] {
    return this.metrics.get(name) || [];
  }

  setCustomMetric(name: string, value: any): void {
    this.customMetrics.set(name, value);
  }

  getCustomMetric(name: string): any {
    return this.customMetrics.get(name);
  }

  getStats(
    name: string,
    duration?: number,
  ): {
    avg: number;
    min: number;
    max: number;
    count: number;
    p95?: number;
    p99?: number;
  } {
    const values = this.getMetricValues(name, duration);
    if (values.length === 0) {
      return {
        avg: 0,
        min: 0,
        max: 0,
        count: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: values.length,
      p95: this.calculatePercentile(sorted, 95),
      p99: this.calculatePercentile(sorted, 99),
    };
  }

  private getMetricValues(name: string, duration?: number): number[] {
    const values = this.metrics.get(name) || [];
    if (!duration) {
      return values;
    }

    const cutoff = Date.now() - duration;
    return values.filter((_, index) => {
      const timestamp = this.getTimestampForIndex(name, index);
      return timestamp >= cutoff;
    });
  }

  private getTimestampForIndex(name: string, index: number): number {
    // This is a simplified implementation. In a real system, you'd store timestamps with values
    return Date.now() - (this.metrics.get(name)?.length || 0 - index) * 1000;
  }

  private calculatePercentile(sorted: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private cleanup(name: string): void {
    const values = this.metrics.get(name);
    if (!values) return;

    const cutoff = Date.now() - this.retentionPeriod;
    const newValues = values.filter((_, index) => {
      const timestamp = this.getTimestampForIndex(name, index);
      return timestamp >= cutoff;
    });

    this.metrics.set(name, newValues);
  }

  getAllMetrics(): Map<string, number[]> {
    return new Map(this.metrics);
  }

  getAllCustomMetrics(): Map<string, any> {
    return new Map(this.customMetrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.customMetrics.clear();
  }
}
