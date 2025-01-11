import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";
import { UserRole } from "../../enums/user-role.enum";
import { SystemConfigKey } from "../enums/system-config-key.enum";

@Entity("config_audit_logs")
export class ConfigAuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: SystemConfigKey,
  })
  config_key: SystemConfigKey;

  @Column("jsonb", { nullable: true })
  old_value: any;

  @Column("jsonb")
  new_value: any;

  @Column()
  updated_by: string;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  created_at: Date;
}
