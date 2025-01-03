import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Buyer } from '../../buyers/entities/buyer.entity';
import { Produce } from '../../produce/entities/produce.entity';

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @ManyToOne(() => Buyer, buyer => buyer.transactions)
  @JoinColumn({ name: 'buyer_id' })
  buyer: Buyer;

  @Column({ name: 'produce_id' })
  produceId: string;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'decimal' })
  quantity: number;

  @Column({ type: 'decimal' })
  totalCost: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 