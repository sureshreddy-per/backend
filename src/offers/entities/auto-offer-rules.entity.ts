import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('auto_offer_rules')
export class AutoOfferRules {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true })
  priceChangeExpiry: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.00 })
  significantPriceChangePercent: number;

  @Column({ type: 'int', default: 24 })
  defaultExpiryHours: number;

  @Column({ type: 'int', default: 5 })
  maxActiveOffersPerProduce: number;

  @Column({ default: 15 })
  graceMinutes: number;

  @Column({ default: 3 })
  maxSimultaneousOffers: number;

  @Column('simple-array', { default: 'rating,distance,historicalTransactions' })
  priorityOrder: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 