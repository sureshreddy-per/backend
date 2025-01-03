import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Quality } from '../../quality/entities/quality.entity';
import { Offer } from '../../offers/entities/offer.entity';

export enum ProduceStatus {
  PENDING = 'PENDING',
  ASSESSED = 'ASSESSED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINAL_PRICE = 'FINAL_PRICE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('produce')
export class Produce {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer, customer => customer.produces)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  type: string;

  @Column({ type: 'decimal' })
  quantity: number;

  @Column({ type: 'jsonb', array: true, default: [] })
  photos: string[];

  @Column({ nullable: true })
  video: string;

  @Column({ name: 'quality_id', nullable: true })
  qualityId: string;

  @ManyToOne(() => Quality, { nullable: true })
  @JoinColumn({ name: 'quality_id' })
  quality: Quality;

  @Column({
    type: 'enum',
    enum: ProduceStatus,
    default: ProduceStatus.PENDING,
  })
  status: ProduceStatus;

  @Column({ type: 'float', nullable: true })
  lat: number;

  @Column({ type: 'float', nullable: true })
  lng: number;

  @OneToMany(() => Offer, offer => offer.produce)
  offers: Offer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 