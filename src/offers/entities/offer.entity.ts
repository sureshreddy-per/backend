import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN'
}

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'produce_id' })
  produceId: string;

  @ManyToOne(() => Produce, produce => produce.offers)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ type: 'decimal' })
  quantity: number;

  @Column()
  unit: string;

  @Column({ name: 'grade_used' })
  gradeUsed: string;

  @Column({ name: 'quoted_price', type: 'decimal', precision: 10, scale: 2 })
  quotedPrice: number;

  @Column({ name: 'final_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  finalPrice: number;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING
  })
  status: OfferStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    notes?: string;
    terms?: string;
    validUntil?: Date;
    paymentTerms?: string;
    deliveryPreference?: string;
    overrideReason?: string;
    autoCalculated?: boolean;
    originalPrice?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 