import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';

@Entity('notification_preferences')
export class NotificationPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  user_id: string;

  @Column({ name: 'email_enabled', type: 'boolean', default: true })
  email_enabled: boolean;

  @Column({ name: 'sms_enabled', type: 'boolean', default: true })
  sms_enabled: boolean;

  @Column({ name: 'push_enabled', type: 'boolean', default: true })
  push_enabled: boolean;

  @Column({
    name: 'notification_types',
    type: 'enum',
    enum: NotificationType,
    enumName: 'notification_type_enum',
    array: true,
    default: []
  })
  notification_types: NotificationType[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
} 