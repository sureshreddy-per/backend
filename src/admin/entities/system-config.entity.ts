import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'min_produce_price', type: 'decimal', precision: 10, scale: 2 })
  min_produce_price: number;

  @Column({ name: 'max_produce_price', type: 'decimal', precision: 10, scale: 2 })
  max_produce_price: number;

  @Column({ name: 'max_offer_validity_days', type: 'int' })
  max_offer_validity_days: number;

  @Column({ name: 'min_transaction_amount', type: 'decimal', precision: 10, scale: 2 })
  min_transaction_amount: number;

  @Column({ name: 'inspection_required_above', type: 'decimal', precision: 10, scale: 2 })
  inspection_required_above: number;

  @Column({ name: 'auto_approve_below', type: 'decimal', precision: 10, scale: 2 })
  auto_approve_below: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
} 