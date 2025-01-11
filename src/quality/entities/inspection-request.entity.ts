import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { QualityAssessment } from "./quality-assessment.entity";

export enum InspectionRequestStatus {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

@Entity("inspection_requests")
export class InspectionRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "produce_id" })
  produce_id: string;

  @Column({ name: "requester_id" })
  requester_id: string;

  @Column({ name: "inspector_id", nullable: true })
  inspector_id?: string;

  @Column({
    type: "enum",
    enum: ProduceCategory
  })
  category: ProduceCategory;

  @Column()
  location: string;

  @Column("decimal", { precision: 10, scale: 2 })
  inspection_fee: number;

  @Column({
    type: "enum",
    enum: InspectionRequestStatus,
    default: InspectionRequestStatus.PENDING
  })
  status: InspectionRequestStatus;

  @Column({ type: "timestamp", nullable: true })
  scheduled_at?: Date;

  @Column({ type: "timestamp", nullable: true })
  assigned_at?: Date;

  @Column({ type: "timestamp", nullable: true })
  completed_at?: Date;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @OneToOne(() => QualityAssessment, (assessment) => assessment.inspection_request)
  quality_assessment: QualityAssessment;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 