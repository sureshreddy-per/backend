import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NotificationType {
  NEW_OFFER = 'NEW_OFFER',
  AUTO_OFFER_CREATED = 'AUTO_OFFER_CREATED',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_REJECTED = 'OFFER_REJECTED',
  OFFER_EXPIRED = 'OFFER_EXPIRED',
  OFFER_STATUS_CHANGE = 'OFFER_STATUS_CHANGE',
  TRANSACTION_COMPLETED = 'TRANSACTION_COMPLETED',
  TRANSACTION_UPDATE = 'TRANSACTION_UPDATE',
  QUALITY_ASSESSMENT_COMPLETED = 'QUALITY_ASSESSMENT_COMPLETED',
  QUALITY_UPDATE = 'QUALITY_UPDATE',
  NEW_INSPECTION_REQUEST = 'NEW_INSPECTION_REQUEST',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
  INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',
  INSPECTION_CANCELLED = 'INSPECTION_CANCELLED',
  SUPPORT_TICKET_UPDATED = 'SUPPORT_TICKET_UPDATED',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  type: NotificationType;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ default: false })
  is_read: boolean;

  @Column({ nullable: true })
  read_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 