import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Report {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @Column({
    type: "text"
  })
  type: string;

  @Column({
    type: "text"
  })
  format: string;

  @Column({
    type: "text",
    default: "QUEUED",
  })
  status: string;

  @Column("jsonb", { nullable: true })
  parameters: any;

  @Column({ nullable: true })
  file_url: string;

  @Column({ nullable: true })
  file_size: number;

  @Column("jsonb", { nullable: true })
  summary: any;

  @Column({ nullable: true })
  error_message: string;

  @Column({ nullable: true })
  completed_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_time: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
