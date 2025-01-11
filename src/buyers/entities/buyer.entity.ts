import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";

@Entity("buyers")
export class Buyer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ nullable: true })
  gst: string;

  @Column()
  business_name: string;

  @Column({ nullable: true })
  registration_number: string;

  @Column({ nullable: true })
  lat_lng: string;

  @Column({ nullable: true })
  location_name: string;

  @Column()
  address: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  min_price: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  max_price: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'enum', enum: ProduceCategory, array: true, nullable: true })
  categories: ProduceCategory[];

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
