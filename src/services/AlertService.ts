interface AlertRule {
  id?: string;
  name: string;
  metric: string;
  threshold: number;
  duration?: number;
  severity: "info" | "warning" | "error" | "critical";
  enabled?: boolean;
  cooldown?: number;
}

interface Alert {
  id: string;
  ruleId: string;
  name: string;
  status: "active" | "acknowledged" | "resolved";
  severity: string;
  value: number;
  timestamp: Date;
  acknowledgment?: {
    acknowledgedBy: string;
    timestamp: Date;
    comment?: string;
  };
}

export class AlertService {
  private rules: Map<string, AlertRule>;
  private alerts: Map<string, Alert>;
  private alertHistory: Alert[];
  private lastAlertTimes: Map<string, Date>;

  constructor() {
    this.rules = new Map();
    this.alerts = new Map();
    this.alertHistory = [];
    this.lastAlertTimes = new Map();
  }

  async addRule(rule: AlertRule): Promise<AlertRule> {
    const id = rule.id || this.generateId();
    const newRule = {
      ...rule,
      id,
      enabled: rule.enabled ?? true,
    };
    this.rules.set(id, newRule);
    return newRule;
  }

  async updateRule(
    id: string,
    updates: Partial<AlertRule>,
  ): Promise<AlertRule> {
    const rule = this.rules.get(id);
    if (!rule) {
      throw new Error(`Rule ${id} not found`);
    }

    const updatedRule = { ...rule, ...updates };
    this.rules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteRule(id: string): Promise<void> {
    if (!this.rules.delete(id)) {
      throw new Error(`Rule ${id} not found`);
    }
  }

  async getRule(id: string): Promise<AlertRule | undefined> {
    return this.rules.get(id);
  }

  async getAllRules(): Promise<AlertRule[]> {
    return Array.from(this.rules.values());
  }

  async checkMetric(metric: string, value: number): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const shouldAlert = await this.evaluateRule(rule, metric, value);
      if (shouldAlert) {
        await this.createAlert(rule, value);
      } else {
        await this.resolveAlerts(rule.id!);
      }
    }
  }

  private async evaluateRule(
    rule: AlertRule,
    metric: string,
    value: number,
  ): Promise<boolean> {
    if (rule.metric !== metric) return false;

    const lastAlertTime = this.lastAlertTimes.get(rule.id!);
    if (lastAlertTime && rule.cooldown) {
      const timeSinceLastAlert = Date.now() - lastAlertTime.getTime();
      if (timeSinceLastAlert < rule.cooldown) {
        return false;
      }
    }

    return value >= rule.threshold;
  }

  private async createAlert(rule: AlertRule, value: number): Promise<Alert> {
    const alert: Alert = {
      id: this.generateId(),
      ruleId: rule.id!,
      name: rule.name,
      status: "active",
      severity: rule.severity,
      value,
      timestamp: new Date(),
    };

    this.alerts.set(alert.id, alert);
    this.alertHistory.push({ ...alert });
    this.lastAlertTimes.set(rule.id!, new Date());

    return alert;
  }

  async acknowledgeAlert(
    id: string,
    acknowledgment: {
      acknowledgedBy: string;
      comment?: string;
    },
  ): Promise<Alert> {
    const alert = this.alerts.get(id);
    if (!alert) {
      throw new Error(`Alert ${id} not found`);
    }

    const updatedAlert = {
      ...alert,
      status: "acknowledged" as const,
      acknowledgment: {
        ...acknowledgment,
        timestamp: new Date(),
      },
    };

    this.alerts.set(id, updatedAlert);
    this.updateAlertHistory(updatedAlert);

    return updatedAlert;
  }

  private async resolveAlerts(ruleId: string): Promise<void> {
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.ruleId === ruleId && alert.status === "active") {
        const resolvedAlert = {
          ...alert,
          status: "resolved" as const,
          timestamp: new Date(),
        };
        this.alerts.set(id, resolvedAlert);
        this.updateAlertHistory(resolvedAlert);
      }
    }
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.status === "active",
    );
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async getAlertHistory(
    options: {
      duration?: number;
      severity?: string;
      status?: string;
    } = {},
  ): Promise<Alert[]> {
    let history = [...this.alertHistory];

    if (options.duration) {
      const cutoff = Date.now() - options.duration;
      history = history.filter((alert) => alert.timestamp.getTime() >= cutoff);
    }

    if (options.severity) {
      history = history.filter((alert) => alert.severity === options.severity);
    }

    if (options.status) {
      history = history.filter((alert) => alert.status === options.status);
    }

    return history;
  }

  private updateAlertHistory(alert: Alert): void {
    this.alertHistory.push({ ...alert });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async clearAlerts(): Promise<void> {
    this.alerts.clear();
    this.alertHistory = [];
    this.lastAlertTimes.clear();
  }
}
