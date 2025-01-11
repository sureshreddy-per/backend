import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Offer } from "../../offers/entities/offer.entity";
import { Produce } from '../../produce/entities/produce.entity';

export enum TransactionStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "offer_id" })
  offer_id: string;

  @Column({ name: "produce_id" })
  produce_id: string;

  @Column({ name: "buyer_id" })
  buyer_id: string;

  @Column({ name: "farmer_id" })
  farmer_id: string;

  @Column("decimal", { precision: 10, scale: 2 })
  final_price: number;

  @Column("decimal", { precision: 10, scale: 2 })
  final_quantity: number;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: "timestamp", nullable: true })
  delivery_window_starts_at: Date;

  @Column({ type: "timestamp", nullable: true })
  delivery_window_ends_at: Date;

  @Column({ type: "timestamp", nullable: true })
  delivery_confirmed_at: Date;

  @Column({ type: "timestamp", nullable: true })
  buyer_inspection_completed_at: Date;

  @Column({ type: "boolean", default: false })
  requires_rating: boolean;

  @Column({ type: "boolean", default: false })
  rating_completed: boolean;

  @Column({ type: "boolean", default: false })
  inspection_fee_paid: boolean;

  @Column({ type: "timestamp", nullable: true })
  inspection_fee_paid_at: Date;

  @Column("jsonb", { nullable: true })
  metadata: {
    completed_at?: Date;
    cancelled_at?: Date;
    cancellation_reason?: string;
    buyer_rating?: number;
    farmer_rating?: number;
    buyer_review?: string;
    farmer_review?: string;
    quality_grade?: string;
    inspection_result?: any;
    delivery_notes?: string;
    inspection_notes?: string;
  };

  @ManyToOne(() => Offer)
  @JoinColumn({ name: "offer_id" })
  offer: Offer;

  @ManyToOne(() => Produce)
  @JoinColumn({ name: "produce_id" })
  produce: Produce;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
