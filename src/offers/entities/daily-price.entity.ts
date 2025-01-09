import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProduceCategory } from '../../produce/entities/produce.entity';

@Entity('daily_prices')
export class DailyPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_id' })
  buyer_id: string;

  @Column({
    type: 'enum',
    enum: ProduceCategory
  })
  produce_category: ProduceCategory;

  @Column('decimal', { precision: 10, scale: 2 })
  min_price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  max_price: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp' })
  valid_from: Date;

  @Column({ type: 'timestamp' })
  valid_until: Date;

  @Column({ type: 'int', default: 1 })
  valid_days: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 