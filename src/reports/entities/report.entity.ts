import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ReportType } from "../enums/report-type.enum";
import { ReportFormat } from "../enums/report-format.enum";
import { ReportStatus } from "../enums/report-status.enum";

@Entity()
export class Report {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @Column({
    type: "enum",
    enum: ReportType,
  })
  type: ReportType;

  @Column({
    type: "enum",
    enum: ReportFormat,
  })
  format: ReportFormat;

  @Column({
    type: "enum",
    enum: ReportStatus,
    default: ReportStatus.QUEUED,
  })
  status: ReportStatus;

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
