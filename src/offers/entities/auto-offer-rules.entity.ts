import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Buyer } from '../../buyers/entities/buyer.entity';

@Entity('auto_offer_rules')
export class AutoOfferRules {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_id' })
  buyer_id: string;

  @ManyToOne(() => Buyer)
  @JoinColumn({ name: 'buyer_id' })
  buyer: Buyer;

  @Column()
  produce_category: string;

  @Column({ type: 'decimal', nullable: true })
  min_quantity: number;

  @Column({ type: 'decimal', nullable: true })
  max_quantity: number;

  @Column({ type: 'decimal', nullable: true })
  min_price: number;

  @Column({ type: 'decimal', nullable: true })
  max_price: number;

  @Column({ nullable: true })
  preferred_grade: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 