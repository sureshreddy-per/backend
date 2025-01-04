import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { Produce } from '../../produce/entities/produce.entity';
import { Buyer } from '../../buyers/entities/buyer.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  farmerId: string;

  @ManyToOne(() => Farmer)
  @JoinColumn({ name: 'farmer_id' })
  farmer: Farmer;

  @Column()
  buyerId: string;

  @ManyToOne(() => Buyer)
  @JoinColumn({ name: 'buyer_id' })
  buyer: Buyer;

  @Column()
  produceId: string;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerUnit: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status: TransactionStatus;

  @Column({ type: 'json', nullable: true })
  metadata: {
    priceAtTransaction: number;
    qualityGrade: string;
    notes: string;
  };

  @Column({ nullable: true })
  notes: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;
} 