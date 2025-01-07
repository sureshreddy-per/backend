import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rated_user_id' })
  rated_user_id: string;

  @Column({ name: 'rating_user_id' })
  rating_user_id: string;

  @Column({ name: 'transaction_id' })
  transaction_id: string;

  @Column('decimal', { precision: 2, scale: 1 })
  stars: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rated_user_id' })
  rated_user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rating_user_id' })
  rating_user: User;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
} 