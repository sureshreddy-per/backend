import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

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

  @Column({ type: "timestamp", nullable: true })
  last_login_at: Date;

  @Column({ type: "timestamp", nullable: true })
  scheduled_for_deletion_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
