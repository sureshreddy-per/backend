import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('daily_prices')
export class DailyPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  produce_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  min_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  max_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  average_price: number;

  @Column({ type: 'text', nullable: true })
  market_name: string;

  @Column({ type: 'text', nullable: true })
  location: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
