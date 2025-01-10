import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AdminActionType {
  BLOCK_USER = 'BLOCK_USER',
  UNBLOCK_USER = 'UNBLOCK_USER',
  DELETE_PRODUCE = 'DELETE_PRODUCE',
  CANCEL_OFFER = 'CANCEL_OFFER',
  CANCEL_TRANSACTION = 'CANCEL_TRANSACTION',
  ASSIGN_INSPECTOR = 'ASSIGN_INSPECTOR',
  UPDATE_SYSTEM_CONFIG = 'UPDATE_SYSTEM_CONFIG',
}

@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  admin_id: string;

  @Column({
    type: 'enum',
    enum: AdminActionType,
  })
  action: AdminActionType;

  @Column('uuid')
  entity_id: string;

  @Column('jsonb')
  details: any;

  @Column({ nullable: true })
  entity_type: string;

  @Column({ nullable: true })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 