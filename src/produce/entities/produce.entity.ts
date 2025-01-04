import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Farmer } from '../../farmers/entities/farmer.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { ProduceType } from '../enums/produce-type.enum';
import { QualityGrade } from '../enums/quality-grade.enum';
import { ProduceStatus } from '../enums/produce-status.enum';
import { VerifiedStatus } from '../enums/verified-status.enum';
import { Quality } from '../../quality/entities/quality.entity';

@Entity()
export class Produce {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  farmerId: string;

  @ManyToOne(() => Farmer)
  @JoinColumn({ name: 'farmer_id' })
  farmer: Farmer;

  @Column({
    type: 'enum',
    enum: ProduceType
  })
  type: ProduceType;

  @Column()
  quantity: number;

  @Column()
  unit: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  currency: string;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerUnit: number;

  @Column()
  harvestDate: Date;

  @Column({ nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({
    type: 'enum',
    enum: ProduceStatus,
    default: ProduceStatus.PENDING
  })
  status: ProduceStatus;

  @Column({
    type: 'enum',
    enum: QualityGrade,
    nullable: true
  })
  qualityGrade: QualityGrade;

  @Column({
    type: 'enum',
    enum: VerifiedStatus,
    default: VerifiedStatus.PENDING
  })
  verifiedStatus: VerifiedStatus;

  @Column({ type: 'json', nullable: true })
  location: {
    lat: number;
    lng: number;
  };

  @OneToMany(() => Quality, quality => quality.produce)
  qualityAssessments: Quality[];

  @OneToMany(() => Transaction, transaction => transaction.produce)
  transactions: Transaction[];

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
} 