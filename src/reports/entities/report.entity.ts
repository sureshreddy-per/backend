import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReportType {
  USER_ACTIVITY = 'USER_ACTIVITY',
  TRANSACTION_SUMMARY = 'TRANSACTION_SUMMARY',
  PRODUCE_ANALYTICS = 'PRODUCE_ANALYTICS',
  QUALITY_METRICS = 'QUALITY_METRICS',
  MARKET_TRENDS = 'MARKET_TRENDS',
  FINANCIAL_SUMMARY = 'FINANCIAL_SUMMARY',
  INSPECTION_SUMMARY = 'INSPECTION_SUMMARY',
  CUSTOM = 'CUSTOM'
}

export enum ReportFormat {
  PDF = 'PDF',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  JSON = 'JSON'
}

export enum ReportStatus {
  QUEUED = 'QUEUED',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({
    type: 'enum',
    enum: ReportType
  })
  type: ReportType;

  @Column({
    type: 'enum',
    enum: ReportFormat
  })
  format: ReportFormat;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.QUEUED
  })
  status: ReportStatus;

  @Column({ type: 'jsonb' })
  parameters: {
    date_range?: {
      start: Date;
      end: Date;
    };
    filters?: Record<string, any>;
    grouping?: string[];
    metrics?: string[];
    custom_query?: any;
  };

  @Column({ type: 'varchar', nullable: true })
  file_url: string;

  @Column({ type: 'int', nullable: true })
  file_size: number;

  @Column({ type: 'jsonb', nullable: true })
  summary: {
    total_records?: number;
    aggregates?: Record<string, any>;
    highlights?: any[];
  };

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ name: 'scheduled_time', type: 'timestamp', nullable: true })
  scheduled_time: Date;

  @Column({ name: 'completed_time', type: 'timestamp', nullable: true })
  completed_time: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
} 