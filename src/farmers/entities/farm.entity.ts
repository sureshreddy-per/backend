import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Farmer } from "./farmer.entity";

@Entity("farms")
export class Farm {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  farmer_id: string;

  @ManyToOne(() => Farmer)
  @JoinColumn({ name: "farmer_id" })
  farmer: Farmer;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  size_in_acres: number;

  @Column({ nullable: true })
  address: string;

  @Column({ type: "text", nullable: true })
  location: string;

  @Column({ nullable: true })
  image: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
