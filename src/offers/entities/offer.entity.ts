import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Buyer } from '../../buyers/entities/buyer.entity';
import { Produce } from '../../produce/entities/produce.entity';
import { OfferStatus } from '../enums/offer-status.enum';
import { QualityGrade } from '../../produce/enums/quality-grade.enum';

export interface OfferMetadata {
  qualityGrade?: QualityGrade;
  autoGeneratedAt?: Date;
  priceHistory?: Array<{
    oldPrice: number;
    newPrice: number;
    timestamp: Date;
    reason?: string;
  }>;
  lastPriceUpdate?: {
    oldPrice: number;
    newPrice: number;
    timestamp: Date;
    reason?: string;
  };
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  expiryReason?: string;
  expiryMetadata?: any;
}

@Entity()
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  produceId: string;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column()
  buyerId: string;

  @ManyToOne(() => Buyer)
  @JoinColumn({ name: 'buyer_id' })
  buyer: Buyer;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerUnit: number;

  @Column()
  quantity: number;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING
  })
  status: OfferStatus;

  @Column({ type: 'json' })
  metadata: OfferMetadata;

  @Column({ nullable: true })
  message: string;

  @Column({ nullable: true })
  expiredAt: Date;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;
} 