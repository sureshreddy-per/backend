import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Transaction } from "../../transactions/entities/transaction.entity";

@Entity("ratings")
export class Rating {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "transaction_id" })
  transaction_id: string;

  @Column({ name: "rating_user_id" })
  rating_user_id: string;

  @Column({ name: "rated_user_id" })
  rated_user_id: string;

  @Column("decimal", { precision: 2, scale: 1 })
  rating: number;

  @Column({ nullable: true })
  comment: string;

  @Column({ type: "jsonb", nullable: true })
  aspects: {
    quality_accuracy?: number;
    communication?: number;
    reliability?: number;
    timeliness?: number;
  };

  @ManyToOne(() => User)
  @JoinColumn({ name: "rating_user_id" })
  rating_user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "rated_user_id" })
  rated_user: User;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "transaction_id" })
  transaction: Transaction;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
