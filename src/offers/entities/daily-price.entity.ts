import {
  Entity,
  Column,
} from "typeorm";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { BaseEntity } from "../../common/entities/base.entity";

@Entity("daily_prices")
export class DailyPrice extends BaseEntity {
  @Column({ name: "buyer_id" })
  buyer_id: string;

  @Column({
    type: "enum",
    enum: ProduceCategory,
  })
  produce_category: ProduceCategory;

  @Column("decimal", { precision: 10, scale: 2 })
  min_price: number;

  @Column("decimal", { precision: 10, scale: 2 })
  max_price: number;

  @Column({ type: "int" })
  minimum_quantity: number;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "timestamptz" })
  valid_from: Date;

  @Column({ type: "timestamptz" })
  valid_until: Date;

  @Column({ type: "int", default: 1 })
  valid_days: number;

  @Column({ type: "int", default: 0 })
  update_count: number;
}
