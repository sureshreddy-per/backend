import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';
import { User } from '../../auth/entities/user.entity';

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'produce_id' })
  produceId: string;

  @ManyToOne(() => Produce, produce => produce.transactions)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column({ type: 'decimal' })
  amount: number;

  @Column({ type: 'decimal' })
  quantity: number;

  @Column()
  unit: string;

  @Column({ name: 'total_cost', type: 'decimal' })
  totalCost: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status: TransactionStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    paymentMethod?: string;
    paymentId?: string;
    deliveryDetails?: {
      address: string;
      contactPerson: string;
      phone: string;
    };
    notes?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 