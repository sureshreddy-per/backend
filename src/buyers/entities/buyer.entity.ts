import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('buyers')
export class Buyer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column('json')
  location: {
    lat: number;
    lng: number;
  };

  @Column('json')
  businessDetails: {
    type: string;
    license: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalRatings: number;

  @OneToMany(() => Transaction, transaction => transaction.buyer)
  transactions: Transaction[];

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
} 