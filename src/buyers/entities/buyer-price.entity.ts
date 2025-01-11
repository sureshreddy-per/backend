import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Buyer } from "./buyer.entity";

@Entity("buyer_prices")
export class BuyerPrice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Buyer, { onDelete: "CASCADE" })
  buyer: Buyer;

  @Column()
  buyerId: string;

  @Column()
  qualityGrade: string;

  @Column("decimal", { precision: 10, scale: 2 })
  pricePerUnit: number;

  @Column({ type: "date" })
  effectiveDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
