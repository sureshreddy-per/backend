import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRole } from "../../enums/user-role.enum";

export enum UserStatus {
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
  DELETED = "DELETED",
}

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
    type: "enum",
    enum: UserRole,
    enumName: "user_role_enum",
    default: UserRole.BUYER,
  })
  role: UserRole;

  @Column({
    type: "enum",
    enum: UserStatus,
    enumName: "user_status_enum",
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

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
