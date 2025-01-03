import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Support } from '../../support/entities/support.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Offer } from '../../offers/entities/offer.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('buyers')
export class Buyer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  companyName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'float', nullable: true })
  lat: number;

  @Column({ type: 'float', nullable: true })
  lng: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: false })
  blockedStatus: boolean;

  @OneToMany(() => Support, support => support.buyer)
  supportTickets: Support[];

  @OneToMany(() => Notification, notification => notification.buyer)
  notifications: Notification[];

  @OneToMany(() => Offer, offer => offer.buyer)
  offers: Offer[];

  @OneToMany(() => Transaction, transaction => transaction.buyer)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 