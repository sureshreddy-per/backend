import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum AdminActionType {
  USER_BLOCK = 'USER_BLOCK',
  USER_UNBLOCK = 'USER_UNBLOCK',
  USER_DELETE = 'USER_DELETE',
  PRODUCE_DELETE = 'PRODUCE_DELETE',
  PRODUCE_UPDATE = 'PRODUCE_UPDATE',
  OFFER_CANCEL = 'OFFER_CANCEL',
  TRANSACTION_CANCEL = 'TRANSACTION_CANCEL',
  INSPECTION_ASSIGN = 'INSPECTION_ASSIGN',
  SYSTEM_CONFIG_UPDATE = 'SYSTEM_CONFIG_UPDATE'
}

@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'admin_id' })
  admin_id: string;

  @Column({
    type: 'enum',
    enum: AdminActionType
  })
  action: AdminActionType;

  @Column({ name: 'entity_id', nullable: true })
  entity_id: string;

  @Column({ name: 'entity_type', nullable: true })
  entity_type: string;

  @Column('jsonb')
  details: {
    previous_state?: any;
    new_state?: any;
    reason?: string;
    metadata?: Record<string, any>;
  };

  @Column({ name: 'ip_address', nullable: true })
  ip_address: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
} 