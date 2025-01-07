import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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
  price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  minimum_quantity: number;

  @Column({ type: 'timestamp' })
  valid_from: Date;

  @Column({ type: 'timestamp' })
  valid_until: Date;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
} 