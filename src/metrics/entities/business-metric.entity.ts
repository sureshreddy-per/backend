import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum BusinessMetricType {
  // User metrics
  USER_REGISTRATION = 'USER_REGISTRATION',
  USER_LOGIN = 'USER_LOGIN',
  USER_VERIFICATION = 'USER_VERIFICATION',

  // Produce metrics
  PRODUCE_LISTING = 'PRODUCE_LISTING',
  PRODUCE_INSPECTION = 'PRODUCE_INSPECTION',
  PRODUCE_QUALITY_UPDATE = 'PRODUCE_QUALITY_UPDATE',

  // Offer metrics
  OFFER_CREATION = 'OFFER_CREATION',
  OFFER_ACCEPTANCE = 'OFFER_ACCEPTANCE',
  OFFER_REJECTION = 'OFFER_REJECTION',
  OFFER_EXPIRY = 'OFFER_EXPIRY',

  // Transaction metrics
  TRANSACTION_CREATION = 'TRANSACTION_CREATION',
  TRANSACTION_COMPLETION = 'TRANSACTION_COMPLETION',
  TRANSACTION_CANCELLATION = 'TRANSACTION_CANCELLATION',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',

  // Notification metrics
  NOTIFICATION_SENT = 'NOTIFICATION_SENT',
  NOTIFICATION_READ = 'NOTIFICATION_READ',
  PUSH_NOTIFICATION_SENT = 'PUSH_NOTIFICATION_SENT',

  // System metrics
  DAILY_PRICE_UPDATE = 'DAILY_PRICE_UPDATE',
  GEOLOCATION_SEARCH = 'GEOLOCATION_SEARCH',
  FILE_UPLOAD = 'FILE_UPLOAD'
}

@Entity('business_metrics')
export class BusinessMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: BusinessMetricType
  })
  type: BusinessMetricType;

  @Column({ name: 'user_id', nullable: true })
  user_id: string;

  @Column({ name: 'entity_id', nullable: true })
  entity_id: string;

  @Column({ name: 'entity_type', nullable: true })
  entity_type: string;

  @Column({ name: 'processing_time', nullable: true })
  processing_time: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    location?: {
      latitude: number;
      longitude: number;
    };
    file_size?: number;
    mime_type?: string;
    error?: string;
    status?: string;
    previous_state?: any;
    new_state?: any;
    device_info?: {
      platform: string;
      version: string;
      device: string;
    };
    additional_info?: Record<string, any>;
  };

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
} 