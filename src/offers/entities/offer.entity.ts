import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Buyer } from '../../buyers/entities/buyer.entity';
import { Produce } from '../../produce/entities/produce.entity';

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @ManyToOne(() => Buyer, buyer => buyer.offers)
  @JoinColumn({ name: 'buyer_id' })
  buyer: Buyer;

  @Column({ name: 'produce_id' })
  produceId: string;

  @ManyToOne(() => Produce, produce => produce.offers)
  @JoinColumn({ name: 'produce_id' })
  produce: Produce;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ type: 'decimal' })
  quantity: number;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 