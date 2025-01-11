import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Buyer } from "./buyer.entity";

@Entity("buyer_preferences")
export class BuyerPreferences {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  buyer_id: string;

  @ManyToOne(() => Buyer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "buyer_id" })
  buyer: Buyer;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  min_price: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  max_price: number;

  @Column({ type: "jsonb", nullable: true })
  categories: string[];

  @Column({ default: true })
  notification_enabled: boolean;

  @Column({ type: "jsonb", nullable: true })
  notification_methods: string[];

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  target_price: number;

  @Column({ nullable: true })
  price_alert_condition: string;

  @Column({ type: "timestamp", nullable: true })
  expiry_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 