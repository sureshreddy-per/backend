import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Offer } from '../../offers/entities/offer.entity';
import { Produce } from '../../produce/entities/produce.entity';

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'offer_id' })
  offer_id: string;

  @Column({ name: 'produce_id' })
  produce_id: string;

  @Column({ name: 'buyer_id' })
  buyer_id: string;

  @Column({ name: 'farmer_id' })
  farmer_id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  final_price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  final_quantity: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status: TransactionStatus;

  @Column('jsonb', { nullable: true })
  metadata: {
    completed_at?: Date;
    cancelled_at?: Date;
    cancellation_reason?: string;
    buyer_rating?: number;
    farmer_rating?: number;
    buyer_review?: string;
    farmer_review?: string;
    quality_grade?: string;
    inspection_result?: any;
  };

  @ManyToOne(() => Offer)
  @JoinColumn({ name: 'offer_id' })
  offer: Offer;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
} 