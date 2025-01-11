import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum MetricType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY"
}

export enum MetricCategory {
  REVENUE = "REVENUE",
  TRANSACTIONS = "TRANSACTIONS",
  USERS = "USERS",
  PRODUCE = "PRODUCE",
  INSPECTIONS = "INSPECTIONS",
  OFFERS = "OFFERS"
}

@Entity("business_metrics")
export class BusinessMetric {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: MetricType
  })
  type: MetricType;

  @Column({
    type: "enum",
    enum: MetricCategory
  })
  category: MetricCategory;

  @Column("jsonb")
  data: {
    value: number;
    change_percentage?: number;
    breakdown?: Record<string, number>;
  };

  @Column()
  period_start: Date;

  @Column()
  period_end: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 