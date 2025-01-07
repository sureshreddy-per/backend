import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  OFFER_CREATED = 'OFFER_CREATED',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_REJECTED = 'OFFER_REJECTED',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
  QUALITY_ASSESSMENT_COMPLETED = 'QUALITY_ASSESSMENT_COMPLETED',
  TRANSACTION_COMPLETED = 'TRANSACTION_COMPLETED',
  OFFER_UPDATED = 'OFFER_UPDATED',
  RATING_RECEIVED = 'RATING_RECEIVED',
  QUALITY_UPDATED = 'QUALITY_UPDATED',
  PRICE_UPDATED = 'PRICE_UPDATED'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  READ = 'READ'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ default: false })
  is_read: boolean;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ nullable: true })
  user_id: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 