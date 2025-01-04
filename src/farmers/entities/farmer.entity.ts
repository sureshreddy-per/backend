import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity()
export class Farmer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column()
  phoneNumber: string;

  @Column()
  email: string;

  @Column('json')
  location: {
    lat: number;
    lng: number;
  };

  @Column()
  farmSize: number;

  @Column()
  farmSizeUnit: string;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalRatings: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Produce, produce => produce.farmer)
  produce: Produce[];

  @OneToMany(() => Transaction, transaction => transaction.farmer)
  transactions: Transaction[];

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
} 