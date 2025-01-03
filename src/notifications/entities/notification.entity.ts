import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';
import { Customer } from '../../customers/entities/customer.entity';
import { Buyer } from '../../buyers/entities/buyer.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

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

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 