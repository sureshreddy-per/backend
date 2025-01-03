import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Buyer } from '../../buyers/entities/buyer.entity';

export enum SupportStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SupportPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum SupportCategory {
  GENERAL = 'GENERAL',
  TECHNICAL = 'TECHNICAL',
  BILLING = 'BILLING',
  ACCOUNT = 'ACCOUNT',
  ORDER = 'ORDER',
  OTHER = 'OTHER',
}

@Entity('support_tickets')
export class Support {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: SupportStatus,
    default: SupportStatus.OPEN,
  })
  status: SupportStatus;

  @Column({
    type: 'enum',
    enum: SupportPriority,
    default: SupportPriority.MEDIUM,
  })
  priority: SupportPriority;

  @Column({
    type: 'enum',
    enum: SupportCategory,
  })
  category: SupportCategory;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'uuid', nullable: true })
  buyerId: string | null;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Buyer, { nullable: true })
  @JoinColumn({ name: 'buyerId' })
  buyer: Buyer;

  @Column('simple-array', { default: [] })
  attachments: string[];

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 