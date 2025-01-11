import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Buyer } from "../../buyers/entities/buyer.entity";
import { BaseEntity } from "../../common/entities/base.entity";

@Entity("auto_offer_rules")
export class AutoOfferRules extends BaseEntity {
  @Column({ name: "buyer_id" })
  buyer_id: string;

  @ManyToOne(() => Buyer)
  @JoinColumn({ name: "buyer_id" })
  buyer: Buyer;
  
  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column()
  produce_category: string;

  @Column({ type: "decimal", nullable: true })
  min_quantity: number;

  @Column({ type: "decimal", nullable: true })
  max_quantity: number;

  @Column({ type: "decimal", nullable: true })
  min_price: number;

  @Column({ type: "decimal", nullable: true })
  max_price: number;

  @Column({ nullable: true })
  preferred_grade: string;
}
