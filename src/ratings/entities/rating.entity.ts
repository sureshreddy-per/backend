import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Offer } from '../../offers/entities/offer.entity';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rated_by_user_id' })
  ratedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rated_by_user_id' })
  ratedByUser: User;

  @Column({ name: 'rated_user_id' })
  ratedUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rated_user_id' })
  ratedUser: User;

  @Column({ name: 'offer_id' })
  offerId: string;

  @ManyToOne(() => Offer)
  @JoinColumn({ name: 'offer_id' })
  offer: Offer;

  @Column({ type: 'integer', name: 'stars' })
  stars: number;

  @Column({ name: 'review_text', type: 'text', nullable: true })
  reviewText: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    categories?: {
      communication?: number;
      reliability?: number;
      quality?: number;
    };
    tags?: string[];
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
} 