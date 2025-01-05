import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Produce } from '../../produce/entities/produce.entity';
import { User } from '../../users/entities/user.entity';
import { OfferMetadata } from '../interfaces/offer-metadata.interface';

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

@Entity()
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Produce, produce => produce.offers)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column('uuid')
  produceId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column('uuid')
  buyerId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerUnit: number;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING
  })
  status: OfferStatus;

  @Column('jsonb', { nullable: true })
  metadata: OfferMetadata;

  @Column({ nullable: true })
  message: string;

  @Column({ nullable: true })
  validUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
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