import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemMetrics } from './system-monitor.service';

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  timestamp: Date;
  metrics?: Partial<SystemMetrics>;
  context?: any;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  type: Alert['type'];
  source: string;
  message: string;
  enabled: boolean;
  cooldown: number; // milliseconds
  lastTriggered?: Date;
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private readonly maxAlertHistory = 1000;

  constructor(private eventEmitter: EventEmitter2) {
    this.initializeDefaultRules();
    this.setupEventListeners();
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'cpu-critical',
        name: 'CPU Critical Usage',
        condition: 'cpuUsage',
        threshold: 0.9,
        type: 'critical',
        source: 'system',
        message: 'CPU usage is critically high',
        enabled: true,
        cooldown: 300000, // 5 minutes
      },
      {
        id: 'memory-critical',
        name: 'Memory Critical Usage',
        condition: 'memoryUsage',
        threshold: 0.9,
        type: 'critical',
        source: 'system',
        message: 'Memory usage is critically high',
        enabled: true,
        cooldown: 300000,
      },
      {
        id: 'error-rate',
        name: 'High Error Rate',
        condition: 'errorRate',
        threshold: 0.1,
        type: 'error',
        source: 'ai',
        message: 'AI service error rate is above threshold',
        enabled: true,
        cooldown: 180000, // 3 minutes
      },
      {
        id: 'processing-time',
        name: 'Long Processing Time',
        condition: 'averageProcessingTime',
        threshold: 5000,
        type: 'warning',
        source: 'processing',
        message: 'Average processing time is above threshold',
        enabled: true,
        cooldown: 180000,
      },
    ];
  }

  private setupEventListeners() {
    this.eventEmitter.on('system.metrics.updated', (metrics: SystemMetrics) => {
      this.evaluateSystemMetrics(metrics);
    });

    this.eventEmitter.on('ai.metrics.updated', (metrics: any) => {
      this.evaluateAIMetrics(metrics);
    });

    this.eventEmitter.on('processing.metrics.updated', (metrics: any) => {
      this.evaluateProcessingMetrics(metrics);
    });
  }

  private evaluateSystemMetrics(metrics: SystemMetrics) {
    const systemRules = this.rules.filter(rule => rule.source === 'system' && rule.enabled);
    
    for (const rule of systemRules) {
      if (rule.lastTriggered && Date.now() - rule.lastTriggered.getTime() < rule.cooldown) {
        continue;
      }

      const value = metrics[rule.condition as keyof SystemMetrics];
      if (typeof value === 'number' && value >= rule.threshold) {
        this.createAlert({
          type: rule.type,
          source: rule.source,
          message: rule.message,
          metrics,
        });
        rule.lastTriggered = new Date();
      }
    }
  }

  private evaluateAIMetrics(metrics: any) {
    const aiRules = this.rules.filter(rule => rule.source === 'ai' && rule.enabled);
    
    for (const rule of aiRules) {
      if (rule.lastTriggered && Date.now() - rule.lastTriggered.getTime() < rule.cooldown) {
        continue;
      }

      const value = metrics[rule.condition];
      if (typeof value === 'number' && value >= rule.threshold) {
        this.createAlert({
          type: rule.type,
          source: rule.source,
          message: rule.message,
          context: metrics,
        });
        rule.lastTriggered = new Date();
      }
    }
  }

  private evaluateProcessingMetrics(metrics: any) {
    const processingRules = this.rules.filter(rule => rule.source === 'processing' && rule.enabled);
    
    for (const rule of processingRules) {
      if (rule.lastTriggered && Date.now() - rule.lastTriggered.getTime() < rule.cooldown) {
        continue;
      }

      const value = metrics[rule.condition];
      if (typeof value === 'number' && value >= rule.threshold) {
        this.createAlert({
          type: rule.type,
          source: rule.source,
          message: rule.message,
          context: metrics,
        });
        rule.lastTriggered = new Date();
      }
    }
  }

  createAlert(params: Omit<Alert, 'id' | 'timestamp'>) {
    const alert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...params,
    };

    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlertHistory) {
      this.alerts.shift();
    }

    this.logger.warn(`New ${alert.type} alert from ${alert.source}: ${alert.message}`);
    this.eventEmitter.emit('alert.created', alert);

    return alert;
  }

  getAlerts(options?: {
    type?: Alert['type'];
    source?: string;
    acknowledged?: boolean;
    limit?: number;
    since?: Date;
  }): Alert[] {
    let filtered = this.alerts;

    if (options?.type) {
      filtered = filtered.filter(alert => alert.type === options.type);
    }
    if (options?.source) {
      filtered = filtered.filter(alert => alert.source === options.source);
    }
    if (typeof options?.acknowledged === 'boolean') {
      filtered = filtered.filter(alert => alert.acknowledged === options.acknowledged);
    }
    if (options?.since) {
      filtered = filtered.filter(alert => alert.timestamp >= options.since);
    }

    return filtered
      .slice(-(options?.limit || filtered.length))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  acknowledgeAlert(alertId: string, userId: string): Alert {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    this.eventEmitter.emit('alert.acknowledged', alert);
    return alert;
  }

  getRules(): AlertRule[] {
    return [...this.rules];
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): AlertRule {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    Object.assign(rule, updates);
    return rule;
  }

  addRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const newRule: AlertRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...rule,
    };
    this.rules.push(newRule);
    return newRule;
  }

  deleteRule(ruleId: string): void {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      throw new Error(`Rule ${ruleId} not found`);
    }
    this.rules.splice(index, 1);
  }
} 