import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("admin_audit_logs")
export class AdminAuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  admin_id: string;

  @Column({
    type: "text"
  })
  action: string;

  @Column("uuid")
  entity_id: string;

  @Column("jsonb")
  details: any;

  @Column({ nullable: true })
  entity_type: string;

  @Column({ nullable: true })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
