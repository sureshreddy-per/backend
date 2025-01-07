import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum AggregationPeriod {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY'
}

@Entity('metrics_aggregates')
export class MetricsAggregate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AggregationPeriod
  })
  period: AggregationPeriod;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'jsonb' })
  metrics: {
    requests: {
      total: number;
      errors: number;
      avg_response_time: number;
    };
    business: Record<string, number>;
  };

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
} 