import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('farmers')
export class Farmer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column('json', { nullable: true })
  location: {
    lat: number;
    lng: number;
  };

  @Column({ nullable: true })
  farmSize: number;

  @Column({ nullable: true })
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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Virtual property - not stored in database
  produceCount?: number;
} 