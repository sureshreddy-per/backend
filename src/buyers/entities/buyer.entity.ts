import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Offer } from '../../offers/entities/offer.entity';

@Entity('buyers')
export class Buyer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'jsonb', nullable: true })
  businessDetails: {
    companyName?: string;
    registrationNumber?: string;
    taxId?: string;
    businessType?: string;
    yearEstablished?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    preferredCategories?: string[];
    preferredLocations?: string[];
    maxDistance?: number;
    priceRange?: {
      min: number;
      max: number;
      currency: string;
    };
  };

  @OneToMany(() => Transaction, transaction => transaction.buyerId)
  transactions: Transaction[];

  @OneToMany(() => Offer, offer => offer.buyerId)
  offers: Offer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 