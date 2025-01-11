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
import { ProduceCategory } from "../../produce/enums/produce-category.enum";

@Entity("buyer_preferences")
export class BuyerPreferences {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  buyer_id: string;

  @ManyToOne(() => Buyer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "buyer_id" })
  buyer: Buyer;

  @Column({ type: 'enum', enum: ProduceCategory, array: true, nullable: true })
  categories: ProduceCategory[];

  @Column({ default: true })
  notification_enabled: boolean;

  @Column({ type: "text", array: true, nullable: true })
  notification_methods: string[];

  @Column({ nullable: true })
  price_alert_condition: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  target_price: number;

  @Column({ type: "timestamp", nullable: true })
  expiry_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 