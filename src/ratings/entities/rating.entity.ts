import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Offer } from '../../offers/entities/offer.entity';

export interface RatingCategories {
  communication?: number;
  reliability?: number;
  quality?: number;
}

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rated_user_id: string;

  @Column()
  rating_user_id: string;

  @Column({ nullable: true })
  transaction_id?: string;

  @Column({ nullable: true })
  offer_id?: string;

  @Column('decimal', { precision: 2, scale: 1 })
  stars: number;

  @Column({ type: 'text', nullable: true })
  review_text?: string;

  @Column({ type: 'jsonb', nullable: true })
  categories?: RatingCategories;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rated_user_id' })
  rated_user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rating_user_id' })
  rating_user: User;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction?: Transaction;

  @ManyToOne(() => Offer)
  @JoinColumn({ name: 'offer_id' })
  offer?: Offer;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 