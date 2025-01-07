import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Offer } from '../../offers/entities/offer.entity';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { Buyer } from '../../buyers/entities/buyer.entity';
import { Produce } from '../../produce/entities/produce.entity';

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface TransactionMetadata {
  priceAtTransaction?: number;
  qualityGradeAtTransaction?: string;
  locationAtTransaction?: {
    latitude: number;
    longitude: number;
  };
  [key: string]: any;
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  offer_id: string;

  @Column()
  farmer_id: string;

  @Column()
  buyer_id: string;

  @Column()
  produce_id: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  final_price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: TransactionMetadata;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Column({ type: 'text', nullable: true })
  cancellation_reason?: string;

  @ManyToOne(() => Offer)
  @JoinColumn({ name: 'offer_id' })
  offer: Offer;

  @ManyToOne(() => Farmer)
  @JoinColumn({ name: 'farmer_id' })
  farmer: Farmer;

  @ManyToOne(() => Buyer)
  @JoinColumn({ name: 'buyer_id' })
  buyer: Buyer;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 