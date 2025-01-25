import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Buyer } from "./buyer.entity";

interface ProducePricePreference {
  produce_name: string;
  min_price: number;
  max_price: number;
}

@Entity("buyer_preferences")
@Index("idx_buyer_preferences_buyer_id", ["buyer_id"])
@Index("idx_buyer_preferences_created_at", ["created_at"])
export class BuyerPreferences {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  buyer_id: string;

  @OneToOne(() => Buyer, buyer => buyer.preferences)
  @JoinColumn({ name: "buyer_id" })
  buyer: Buyer;

  @Column("text", { array: true, default: "{}" })
  produce_names: string[];

  @Column("jsonb", { default: [] })
  produce_price_preferences: ProducePricePreference[];

  @Column({ default: true })
  notification_enabled: boolean;

  @Column("text", { array: true, default: "{\"PUSH\"}" })
  notification_methods: string[];

  @Column({ type: 'timestamp', nullable: true })
  last_price_updated: Date;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
} 