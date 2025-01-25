import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";

@Entity("users")
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: false, nullable: true })
  email: string;

  @Column({ unique: true })
  mobile_number: string;

  @Column({
    type: "text",
    default: "BUYER"
  })
  role: string;

  @Column({
    type: "text",
    default: "PENDING_VERIFICATION",
  })
  status: string;

  @Column({ nullable: true })
  block_reason: string;

  @Column({ nullable: true })
  fcm_token: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ default: 0 })
  login_attempts: number;

  @Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: "integer", default: 0 })
  total_completed_transactions: number;

  @Column({ type: "timestamp", nullable: true })
  last_login_at: Date;

  @Column({ type: "timestamp", nullable: true })
  scheduled_for_deletion_at: Date;
}
