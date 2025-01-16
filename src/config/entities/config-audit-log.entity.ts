import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("config_audit_logs")
export class ConfigAuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "text"
  })
  config_key: string;

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
