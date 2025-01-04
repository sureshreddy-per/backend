import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Offer } from '../../offers/entities/offer.entity';

export enum ProduceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  ASSESSED = 'ASSESSED',
  COMPLETED = 'COMPLETED',
  FINAL_PRICE = 'FINAL_PRICE'
}

export enum VerifiedStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum ProduceType {
  FRUIT = 'FRUIT',
  VEGETABLE = 'VEGETABLE',
  GRAIN = 'GRAIN',
  DAIRY = 'DAIRY',
  MEAT = 'MEAT',
  OTHER = 'OTHER'
}

@Entity('produces')
export class Produce {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'farmer_id' })
  farmerId: string;

  @ManyToOne(() => Farmer, farmer => farmer.produces)
  @JoinColumn({ name: 'farmer_id' })
  farmer: Farmer;

  @OneToMany(() => Transaction, transaction => transaction.produce)
  transactions: Transaction[];

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ProduceType,
    default: ProduceType.OTHER
  })
  type: ProduceType;

  @Column('decimal', { precision: 10, scale: 6 })
  lat: number;

  @Column('decimal', { precision: 10, scale: 6 })
  lng: number;

  @Column({ type: 'decimal' })
  quantity: number;

  @Column()
  unit: string;

  @Column({ type: 'decimal' })
  price: number;

  @Column({
    type: 'enum',
    enum: ProduceStatus,
    default: ProduceStatus.PENDING
  })
  status: ProduceStatus;

  @Column({
    type: 'enum',
    enum: VerifiedStatus,
    default: VerifiedStatus.NONE
  })
  verifiedStatus: VerifiedStatus;

  @Column({ nullable: true })
  qualityId: string;

  @Column({ nullable: true })
  qualityGrade: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    category?: string;
    variety?: string;
    grade?: string;
    harvestDate?: string;
    expiryDate?: string;
    storageConditions?: string;
    certifications?: string[];
  };

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Offer, offer => offer.produce)
  offers: Offer[];
} 