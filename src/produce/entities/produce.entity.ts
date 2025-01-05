import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { QualityAssessment } from '../../quality/entities/quality-assessment.entity';
import { ProduceType } from '../dto/produce-filter.dto';
import { ProduceStatus } from '../enums/produce-status.enum';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Offer } from '../../offers/entities/offer.entity';

@Entity()
export class Produce {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ProduceType,
    default: ProduceType.OTHER
  })
  type: ProduceType;

  @Column({
    type: 'enum',
    enum: ProduceStatus,
    default: ProduceStatus.PENDING
  })
  status: ProduceStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerUnit: number;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 6 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6 })
  longitude: number;

  @ManyToOne(() => Farmer, farmer => farmer.produce)
  @JoinColumn({ name: 'farmer_id' })
  farmer: Farmer;

  @Column('uuid')
  farmerId: string;

  @OneToOne(() => QualityAssessment, assessment => assessment.produce)
  qualityAssessment: QualityAssessment;

  @Column({ nullable: true })
  qualityGrade: string;

  @OneToMany(() => Transaction, transaction => transaction.produce)
  transactions: Transaction[];

  @OneToMany(() => Offer, offer => offer.produce)
  offers: Offer[];

  @Column('json', { nullable: true })
  location: {
    lat: number;
    lng: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 