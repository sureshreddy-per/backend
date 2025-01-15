import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Buyer } from "./buyer.entity";

@Entity("buyer_preferences")
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

  @Column({ default: true })
  notification_enabled: boolean;

  @Column("text", { array: true, default: "{\"PUSH\"}" })
  notification_methods: string[];

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
} 