import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Produce } from "../../produce/entities/produce.entity";
import { Buyer } from "../../buyers/entities/buyer.entity";
import { OfferStatus } from "../enums/offer-status.enum";
import { BaseEntity } from "../../common/entities/base.entity";

@Entity("offers")
export class Offer extends BaseEntity {
  @Column({ name: "produce_id" })
  produce_id: string;

  @Column({ name: "buyer_id" })
  buyer_id: string;

  @Column({ name: "farmer_id" })
  farmer_id: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price_per_unit: number;

  @Column("decimal", { precision: 10, scale: 2 })
  quantity: number;

  @Column({
    type: "enum",
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus;

  @Column({ type: "timestamp", nullable: true })
  valid_until: Date;

  @Column({ default: false })
  is_auto_generated: boolean;

  @Column("decimal", { precision: 10, scale: 2 })
  buyer_min_price: number;

  @Column("decimal", { precision: 10, scale: 2 })
  buyer_max_price: number;

  @Column("int")
  quality_grade: number;

  @Column("decimal", { precision: 10, scale: 2 })
  distance_km: number;

  @Column("decimal", { precision: 10, scale: 2 })
  inspection_fee: number;

  @Column({ nullable: true })
  rejection_reason: string;

  @Column({ nullable: true })
  cancellation_reason: string;

  @Column({ default: false })
  is_price_overridden: boolean;

  @Column({ nullable: true })
  price_override_reason: string;

  @Column({ type: "timestamp", nullable: true })
  price_override_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    valid_until?: Date;
    auto_generated?: boolean;
    ai_confidence?: number;
    inspection_fee_details?: {
      base_fee: number;
      distance_fee: number;
      total_fee: number;
    };
    quality_assessment?: {
      grade: number;
      defects: string[];
      recommendations: string[];
    };
    price_history?: Array<{
      price: number;
      timestamp: Date;
      reason?: string;
    }>;
    [key: string]: any;
  };

  @ManyToOne(() => Produce)
  @JoinColumn({ name: "produce_id" })
  produce: Produce;

  @ManyToOne(() => Buyer)
  @JoinColumn({ name: "buyer_id" })
  buyer: Buyer;
}
