import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("business_metrics")
export class BusinessMetric {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "text"
  })
  type: string;

  @Column({
    type: "text"
  })
  category: string;

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