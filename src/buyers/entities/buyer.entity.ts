import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { BuyerPreferences } from "./buyer-preferences.entity";
import { Offer } from "../../offers/entities/offer.entity";

@Entity("buyers")
export class Buyer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ nullable: true })
  gst: string;

  @Column()
  business_name: string;

  @Column({ nullable: true })
  registration_number: string;

  @Column({ 
    nullable: true, 
    comment: "Location in 'latitude,longitude' format (e.g., '12.9716,77.5946')" 
  })
  location: string;

  @Column({ nullable: true })
  location_name: string;

  @Column()
  address: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToOne(() => BuyerPreferences, preferences => preferences.buyer)
  preferences: BuyerPreferences;

  @OneToMany(() => Offer, offer => offer.buyer)
  offers: Offer[];

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
