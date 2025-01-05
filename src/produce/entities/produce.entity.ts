import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { Offer } from '../../offers/entities/offer.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { QualityAssessment } from '../../quality/entities/quality-assessment.entity';

export enum ProduceStatus {
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLD = 'SOLD',
  CANCELLED = 'CANCELLED'
}

@Entity()
export class Produce {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  farmerId: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal')
  quantity: number;

  @Column()
  unit: string;

  @Column('decimal')
  price: number;

  @Column('decimal')
  pricePerUnit: number;

  @Column()
  currency: string;

  @Column({
    type: 'enum',
    enum: ProduceStatus,
    default: ProduceStatus.AVAILABLE
  })
  status: ProduceStatus;

  @Column('json')
  location: {
    lat: number;
    lng: number;
  };

  @Column({ nullable: true })
  qualityGrade: string;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Farmer, farmer => farmer.produce)
  farmer: Farmer;

  @OneToMany(() => Offer, offer => offer.produce)
  offers: Offer[];

  @OneToMany(() => Transaction, transaction => transaction.produce)
  transactions: Transaction[];

  @OneToOne(() => QualityAssessment, assessment => assessment.produce)
  qualityAssessment: QualityAssessment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 